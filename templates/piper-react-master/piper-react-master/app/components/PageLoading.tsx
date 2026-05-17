export function PageLoading() {
  return (
    <div className="routePageFallback" role="status" aria-live="polite" aria-label="Đang tải">
      <span className="pageTransitionSpinner" aria-hidden="true" />
    </div>
  );
}
