import { Injectable } from '@nestjs/common';
import type { Request } from 'express';
import type { MakeupApiResult } from './makeup-admin-shared.service';
import {
  handleGetMakeupArtistSchedule,
  handleGetMakeupArtists,
  handleGetMakeupConflicts,
  handleGetMakeupEvents,
  handleGetMakeupPackages,
  handleGetMyMakeupStats,
  handleGetPublicMakeupArtists,
  handlePatchMakeupEvent,
  handlePatchMakeupPackage,
  handlePostMakeupBookingParse,
  handlePostMakeupEvent,
  handlePostMakeupPackage,
} from './makeup-core.service';
import {
  handleGetMakeupAdminOverview,
  handleGetMakeupOrders,
  handleGetMakeupPurchaseInvoices,
  handlePatchMakeupOrder,
  handlePatchMakeupPurchaseInvoice,
  handlePostMakeupOrder,
  handlePostMakeupPurchaseInvoice,
} from './makeup-orders-admin.service';
import {
  handleGetMakeupInventory,
  handlePatchMakeupInventory,
  handlePostMakeupInventory,
} from './makeup-inventory.service';

@Injectable()
export class MakeupService {
  getMakeupEvents(request: Request): Promise<MakeupApiResult> {
    return handleGetMakeupEvents(request);
  }

  postMakeupEvent(request: Request): Promise<MakeupApiResult> {
    return handlePostMakeupEvent(request);
  }

  patchMakeupEvent(
    request: Request,
    eventId: string,
  ): Promise<MakeupApiResult> {
    return handlePatchMakeupEvent(request, eventId);
  }

  getMakeupConflicts(request: Request): Promise<MakeupApiResult> {
    return handleGetMakeupConflicts(request);
  }

  postMakeupBookingParse(request: Request): Promise<MakeupApiResult> {
    return Promise.resolve(handlePostMakeupBookingParse(request));
  }

  getMakeupArtists(request: Request): Promise<MakeupApiResult> {
    return handleGetMakeupArtists(request);
  }

  getPublicMakeupArtists(request: Request): Promise<MakeupApiResult> {
    return handleGetPublicMakeupArtists(request);
  }

  getMakeupArtistSchedule(
    request: Request,
    artistProfileId: string,
  ): Promise<MakeupApiResult> {
    return handleGetMakeupArtistSchedule(request, artistProfileId);
  }

  getMakeupPackages(request: Request): Promise<MakeupApiResult> {
    return handleGetMakeupPackages(request);
  }

  postMakeupPackage(request: Request): Promise<MakeupApiResult> {
    return handlePostMakeupPackage(request);
  }

  patchMakeupPackage(
    request: Request,
    packageId: string,
  ): Promise<MakeupApiResult> {
    return handlePatchMakeupPackage(request, packageId);
  }

  getMyMakeupStats(request: Request): Promise<MakeupApiResult> {
    return handleGetMyMakeupStats(request);
  }

  getMakeupInventory(request: Request): Promise<MakeupApiResult> {
    return handleGetMakeupInventory(request);
  }

  postMakeupInventory(request: Request): Promise<MakeupApiResult> {
    return handlePostMakeupInventory(request);
  }

  patchMakeupInventory(
    request: Request,
    itemId: string,
  ): Promise<MakeupApiResult> {
    return handlePatchMakeupInventory(request, itemId);
  }

  getMakeupOrders(request: Request): Promise<MakeupApiResult> {
    return handleGetMakeupOrders(request);
  }

  postMakeupOrder(request: Request): Promise<MakeupApiResult> {
    return handlePostMakeupOrder(request);
  }

  patchMakeupOrder(
    request: Request,
    orderId: string,
  ): Promise<MakeupApiResult> {
    return handlePatchMakeupOrder(request, orderId);
  }

  getMakeupPurchaseInvoices(request: Request): Promise<MakeupApiResult> {
    return handleGetMakeupPurchaseInvoices(request);
  }

  postMakeupPurchaseInvoice(request: Request): Promise<MakeupApiResult> {
    return handlePostMakeupPurchaseInvoice(request);
  }

  patchMakeupPurchaseInvoice(
    request: Request,
    invoiceId: string,
  ): Promise<MakeupApiResult> {
    return handlePatchMakeupPurchaseInvoice(request, invoiceId);
  }

  getMakeupAdminOverview(request: Request): Promise<MakeupApiResult> {
    return handleGetMakeupAdminOverview(request);
  }
}
