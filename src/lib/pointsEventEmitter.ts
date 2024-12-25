import { EventEmitter } from 'events';

class PointsEventEmitter extends EventEmitter {
  private static instance: PointsEventEmitter;

  private constructor() {
    super();
  }

  public static getInstance(): PointsEventEmitter {
    if (!PointsEventEmitter.instance) {
      PointsEventEmitter.instance = new PointsEventEmitter();
    }
    return PointsEventEmitter.instance;
  }

  public emitPointsUpdate(userId: string, data: any) {
    this.emit(`points-update-${userId}`, data);
  }
}

export const pointsEventEmitter = PointsEventEmitter.getInstance();
