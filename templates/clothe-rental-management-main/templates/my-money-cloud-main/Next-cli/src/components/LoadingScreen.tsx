interface LoadingScreenProps {
  message?: string;
}

export function LoadingScreen({ message = "Loading..." }: LoadingScreenProps) {
  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300 bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900`}
    >
      <div className="text-center px-4">
        {/* Animated logo/spinner */}
        <div className="relative mb-8 w-20 h-20 mx-auto">
          <div
            className={`absolute inset-0 rounded-full border-4 border-t-transparent animate-spin border-blue-600`}
            style={{ animationDuration: "1s" }}
          ></div>
          <div
            className={`absolute inset-0 rounded-full border-purple-600 border-4 border-b-transparent animate-spin`}
            style={{ animationDuration: "1.5s", animationDirection: "reverse" }}
          ></div>
        </div>

        {/* Loading text */}
        <h2
          className={`text-xl font-semibold mb-3 transition-colors text-white`}
        >
          {message}
        </h2>

        {/* Animated dots */}
        <div className="flex justify-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className={`h-2.5 w-2.5 rounded-full animate-bounce bg-blue-600`}
              style={{
                animationDelay: `${i * 0.15}s`,
                animationDuration: "0.6s",
              }}
            ></div>
          ))}
        </div>
      </div>
    </div>
  );
}
