import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayInit,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { RedisService } from '../redis/redis.service';
import { PrismaService } from '../prisma/prisma.service';

interface AuthenticatedSocket extends Socket {
  userId?: string;
  restaurantId?: string;
  role?: string;
  sessionId?: string;
  isCustomer?: boolean;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: '/ws',
})
export class WebsocketGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(WebsocketGateway.name);

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private redis: RedisService,
    private prisma: PrismaService,
  ) {}

  afterInit(server: Server) {
    this.logger.log('🔌 WebSocket Gateway initialized');
    
    // Subscribe to Redis pub/sub for cross-instance communication
    this.subscribeToRedisEvents();
  }

  async handleConnection(client: AuthenticatedSocket) {
    try {
      const token = client.handshake.auth?.token || client.handshake.query?.token;
      const sessionToken = client.handshake.auth?.sessionToken || client.handshake.query?.sessionToken;

      // Staff authentication (JWT)
      if (token) {
        const payload = this.jwtService.verify(token as string, {
          secret: this.configService.get('jwt.secret'),
        });

        client.userId = payload.sub;
        client.restaurantId = payload.restaurantId;
        client.role = payload.role;
        client.isCustomer = false;

        // Join restaurant room
        if (payload.restaurantId) {
          client.join(`restaurant:${payload.restaurantId}`);
          client.join(`staff:${payload.restaurantId}`);
          this.logger.log(`Staff ${payload.sub} joined restaurant ${payload.restaurantId}`);
        }
      }
      // Customer authentication (session token)
      else if (sessionToken) {
        const sessionData = await this.redis.getJson<{
          sessionId: string;
          tableId: string;
          restaurantId: string;
        }>(`session:token:${sessionToken}`);

        if (sessionData) {
          client.sessionId = sessionData.sessionId;
          client.restaurantId = sessionData.restaurantId;
          client.isCustomer = true;

          // Join customer-specific rooms
          client.join(`restaurant:${sessionData.restaurantId}`);
          client.join(`session:${sessionData.sessionId}`);
          client.join(`table:${sessionData.tableId}`);
          
          this.logger.log(`Customer session ${sessionData.sessionId} connected`);
        } else {
          client.disconnect();
          return;
        }
      } else {
        // No authentication, allow limited access (public events)
        this.logger.log(`Anonymous client connected: ${client.id}`);
      }

      this.logger.log(`Client connected: ${client.id}`);
    } catch (error: any) {
      this.logger.error(`Connection error: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: AuthenticatedSocket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  // ============= Staff Events =============

  @SubscribeMessage('staff:join-kitchen')
  handleJoinKitchen(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.restaurantId || client.isCustomer) return;
    
    client.join(`kitchen:${client.restaurantId}`);
    this.logger.log(`Staff joined kitchen: ${client.restaurantId}`);
    
    return { success: true };
  }

  @SubscribeMessage('staff:leave-kitchen')
  handleLeaveKitchen(@ConnectedSocket() client: AuthenticatedSocket) {
    if (!client.restaurantId) return;
    
    client.leave(`kitchen:${client.restaurantId}`);
    return { success: true };
  }

  // ============= Order Events (Staff) =============

  @SubscribeMessage('order:confirm')
  async handleOrderConfirm(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    if (!client.restaurantId || client.isCustomer) return;

    // Emit to all staff and the customer session
    this.server.to(`restaurant:${client.restaurantId}`).emit('order:confirmed', {
      orderId: data.orderId,
      confirmedBy: client.userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('order:start-preparing')
  async handleOrderStartPreparing(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    if (!client.restaurantId || client.isCustomer) return;

    this.server.to(`restaurant:${client.restaurantId}`).emit('order:preparing', {
      orderId: data.orderId,
      preparedBy: client.userId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('order:ready')
  async handleOrderReady(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { orderId: string },
  ) {
    if (!client.restaurantId || client.isCustomer) return;

    this.server.to(`restaurant:${client.restaurantId}`).emit('order:ready', {
      orderId: data.orderId,
      timestamp: new Date().toISOString(),
    });

    // Play notification sound on kitchen displays
    this.server.to(`staff:${client.restaurantId}`).emit('notification:sound', {
      type: 'order-ready',
    });

    return { success: true };
  }

  // ============= Table Events =============

  @SubscribeMessage('table:call-waiter')
  async handleCallWaiter(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tableId?: string; reason?: string },
  ) {
    if (!client.restaurantId) return;

    const tableId = data.tableId || (client as any).tableId;

    // Get table info
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { number: true, name: true },
    });

    // Emit to staff
    this.server.to(`staff:${client.restaurantId}`).emit('table:waiter-called', {
      tableId,
      tableNumber: table?.number,
      tableName: table?.name,
      reason: data.reason,
      sessionId: client.sessionId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  @SubscribeMessage('table:request-bill')
  async handleRequestBill(
    @ConnectedSocket() client: AuthenticatedSocket,
    @MessageBody() data: { tableId?: string },
  ) {
    if (!client.restaurantId) return;

    const tableId = data.tableId || (client as any).tableId;

    // Get table info
    const table = await this.prisma.table.findUnique({
      where: { id: tableId },
      select: { number: true, name: true },
    });

    // Emit to staff
    this.server.to(`staff:${client.restaurantId}`).emit('table:bill-requested', {
      tableId,
      tableNumber: table?.number,
      tableName: table?.name,
      sessionId: client.sessionId,
      timestamp: new Date().toISOString(),
    });

    return { success: true };
  }

  // ============= Public Methods (called from services) =============

  /**
   * Emit event to a specific restaurant
   */
  emitToRestaurant(restaurantId: string, event: string, data: any) {
    this.server.to(`restaurant:${restaurantId}`).emit(event, data);
  }

  /**
   * Emit event to staff only
   */
  emitToStaff(restaurantId: string, event: string, data: any) {
    this.server.to(`staff:${restaurantId}`).emit(event, data);
  }

  /**
   * Emit event to kitchen
   */
  emitToKitchen(restaurantId: string, event: string, data: any) {
    this.server.to(`kitchen:${restaurantId}`).emit(event, data);
  }

  /**
   * Emit event to a specific session
   */
  emitToSession(sessionId: string, event: string, data: any) {
    this.server.to(`session:${sessionId}`).emit(event, data);
  }

  /**
   * Emit event to a specific table
   */
  emitToTable(tableId: string, event: string, data: any) {
    this.server.to(`table:${tableId}`).emit(event, data);
  }

  // ============= Redis Pub/Sub =============

  private async subscribeToRedisEvents() {
    try {
      // Create a separate Redis client for subscriptions
      const subscriber = this.redis.getClient().duplicate();
      
      subscriber.on('error', (err) => {
        this.logger.error(`Redis subscriber error: ${err.message}`);
      });

      // Use psubscribe for pattern matching (ioredis style)
      subscriber.psubscribe('restaurant:*', (err, count) => {
        if (err) {
          this.logger.error(`Failed to subscribe: ${err.message}`);
        } else {
          this.logger.log(`📡 Redis Pub/Sub subscribed to ${count} pattern(s)`);
        }
      });

      subscriber.on('pmessage', (pattern: string, channel: string, message: string) => {
        try {
          const data = JSON.parse(message);
          const restaurantId = channel.split(':')[1];

          // Forward to WebSocket clients
          this.server.to(`restaurant:${restaurantId}`).emit(data.event, data.data);

          this.logger.debug(`Redis event forwarded: ${data.event} to ${restaurantId}`);
        } catch (error: any) {
          this.logger.error(`Error processing Redis message: ${error.message}`);
        }
      });
    } catch (error: any) {
      this.logger.error(`Failed to setup Redis subscription: ${error.message}`);
    }
  }
}
