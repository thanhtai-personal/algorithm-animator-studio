import { useZaloMiniAppSupport } from "@/features/support/hooks/useZaloMiniAppSupport";

export function ZaloSupportButton() {
  const support = useZaloMiniAppSupport();

  return (
    <section className="zalo-card">
      <h2>OA Support</h2>
      <p className="muted">Mo showOAWidget de tro chuyen nhanh voi OA.</p>

      <button type="button" onClick={() => void support.openOA()} disabled={support.isPending}>
        {support.isPending ? "Dang mo OA..." : "Mo OA ho tro"}
      </button>

      {support.errorMessage ? <p className="error-text">{support.errorMessage}</p> : null}
    </section>
  );
}
