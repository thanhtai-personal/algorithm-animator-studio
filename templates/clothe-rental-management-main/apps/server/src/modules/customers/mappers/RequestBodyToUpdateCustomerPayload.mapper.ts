import type { UpdateCustomerPayload } from '../types/customers-crm.type';

export class RequestBodyToUpdateCustomerPayloadMapper {
  map(body: Record<string, unknown>): UpdateCustomerPayload | null {
    const payload: UpdateCustomerPayload = {};

    if (Object.prototype.hasOwnProperty.call(body, 'fullName')) {
      const fullName = this.parseString(body.fullName);
      if (!fullName) return null;
      payload.fullName = fullName;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'phone')) {
      const phone = this.parseString(body.phone);
      if (!phone) return null;
      payload.phone = phone;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'socialLink')) {
      const socialLink = this.parseOptionalNullableString(body.socialLink);
      if (socialLink === undefined) return null;
      payload.socialLink = socialLink;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'address')) {
      const address = this.parseOptionalNullableString(body.address);
      if (address === undefined) return null;
      payload.address = address;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'note')) {
      const note = this.parseOptionalNullableString(body.note);
      if (note === undefined) return null;
      payload.note = note;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'isActive')) {
      const isActive = this.parseOptionalBoolean(body.isActive);
      if (isActive === undefined) return null;
      payload.isActive = isActive;
    }

    if (Object.prototype.hasOwnProperty.call(body, 'tagIds')) {
      const tagIds = this.parseTagIds(body.tagIds);
      if (tagIds === null) return null;
      payload.tagIds = tagIds;
    }

    if (Object.keys(payload).length === 0) {
      return null;
    }

    return payload;
  }

  maps(
    bodies: ReadonlyArray<Record<string, unknown>>,
  ): UpdateCustomerPayload[] {
    return bodies
      .map((body) => this.map(body))
      .filter((payload): payload is UpdateCustomerPayload => payload !== null);
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
