import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import {
  handleCancelReturnOrder,
  handleCompleteReturnOrder,
  handleCreateReturnOrder,
  handleGetReturnOrderDetail,
  handleGetReturnOrderSources,
  handlePatchReturnOrderStatus,
  handleSettleReturnOrder,
} from './handlers';
import type { ReturnsApiResult } from './shared';

@Injectable()
export class ReturnsService {
  getReturnOrderSources(request: Request): Promise<ReturnsApiResult> {
    return handleGetReturnOrderSources(request);
  }

  createReturnOrder(request: Request): Promise<ReturnsApiResult> {
    return handleCreateReturnOrder(request);
  }

  getReturnOrderDetail(
    request: Request,
    returnOrderId: string,
  ): Promise<ReturnsApiResult> {
    return handleGetReturnOrderDetail(request, returnOrderId);
  }

  patchReturnOrderStatus(
    request: Request,
    returnOrderId: string,
  ): Promise<ReturnsApiResult> {
    return handlePatchReturnOrderStatus(request, returnOrderId);
  }

  settleReturnOrder(
    request: Request,
    returnOrderId: string,
  ): Promise<ReturnsApiResult> {
    return handleSettleReturnOrder(request, returnOrderId);
  }

  completeReturnOrder(
    request: Request,
    returnOrderId: string,
  ): Promise<ReturnsApiResult> {
    return handleCompleteReturnOrder(request, returnOrderId);
  }

  cancelReturnOrder(
    request: Request,
    returnOrderId: string,
  ): Promise<ReturnsApiResult> {
    return handleCancelReturnOrder(request, returnOrderId);
  }
}
