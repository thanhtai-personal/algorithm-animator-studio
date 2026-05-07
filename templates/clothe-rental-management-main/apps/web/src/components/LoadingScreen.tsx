interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Đang tải..." }: LoadingScreenProps) {
  return (
    <div className="fixed flex flex-col inset-0 z-50 items-center text-center justify-center bg-gradient-background px-4">
      <div className="relative mx-auto mb-5 h-14 w-14">
        <span className="absolute inset-0 rounded-full border-[3px] border-primary/20" />
        <span className="absolute inset-0 rounded-full border-[3px] border-transparent border-t-primary animate-spin motion-reduce:animate-none" />
      </div>

      <p className="mt-1 text-sm text-muted-foreground">KATA-Center</p>

      <div className="mt-4 flex justify-center gap-1.5">
        {[0, 1, 2].map((index) => (
          <span
            key={index}
            className="h-2.5 w-2.5 rounded-full bg-primary/80 animate-bounce motion-reduce:animate-none"
            style={{
              animationDelay: `${index * 120}ms`,
              animationDuration: "700ms",
            }}
          />
        ))}
      </div>
    </div>
  );
}
