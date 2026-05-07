import type { CreateCustomerPayload } from '../types/customers-crm.type';

export class RequestBodyToCreateCustomerPayloadMapper {
  map(body: Record<string, unknown>): CreateCustomerPayload | null {
    const branchId = this.parseString(body.branchId);
    const fullName = this.parseString(body.fullName);
    const phone = this.parseString(body.phone);

    if (!branchId || !fullName || !phone) {
      return null;
    }

    const tagIds =
      body.tagIds === undefined ? [] : this.parseTagIds(body.tagIds);
    if (tagIds === null) return null;

    const socialLink = this.parseOptionalNullableString(body.socialLink);
    const address = this.parseOptionalNullableString(body.address);
    const note = this.parseOptionalNullableString(body.note);
    if (
      (body.socialLink !== undefined && socialLink === undefined) ||
      (body.address !== undefined && address === undefined) ||
      (body.note !== undefined && note === undefined)
    ) {
      return null;
    }

    let isActive = true;
    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      const parsedIsActive = this.parseOptionalBoolean(body.isActive);
      if (parsedIsActive === undefined) return null;
      isActive = parsedIsActive;
    }

    return {
      branchId,
      fullName,
      phone,
      socialLink,
      address,
      note,
      isActive,
      tagIds,
    };
  }

  maps(
    bodies: ReadonlyArray<Record<string, unknown>>,
  ): CreateCustomerPayload[] {
    return bodies
      .map((body) => this.map(body))
      .filter((payload): payload is CreateCustomerPayload => payload !== null);
  }

  private parseString(value: unknown): string | null {
    if (typeof value !== 'string') return null;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseOptionalBoolean(value: unknown): boolean | undefined {
    return typeof value === 'boolean' ? value : undefined;
  }

  private parseOptionalNullableString(
    value: unknown,
  ): string | null | undefined {
    if (value === undefined) return undefined;
    if (value === null) return null;
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
  }

  private parseTagIds(value: unknown): string[] | null {
    if (!Array.isArray(value)) return null;

    const seen = new Set<string>();
    const output: string[] = [];

    for (const entry of value) {
      if (typeof entry !== 'string') return null;
      const trimmed = entry.trim();
      if (!trimmed || seen.has(trimmed)) continue;
      seen.add(trimmed);
      output.push(trimmed);
    }

    return output;
  }
}
