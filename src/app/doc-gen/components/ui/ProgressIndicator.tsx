"use client"


type ProgressIndicatorProps = {
  messages: string[]
  progressValue: number | null
}

export function ProgressIndicator({ messages, progressValue }: ProgressIndicatorProps) {
  return (
    <div className="space-y-4 rounded-lg border p-4">
      <h3 className="font-medium">Status generowania:</h3>
      
      {/* Pasek postępu */}
      {progressValue !== null ? (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Postęp: {progressValue}%</span>
            <span className="text-sm text-gray-500">
              {progressValue < 100 ? 'Generowanie...' : 'Zakończono!'}
            </span>
          </div>
          {/* <Progress value={progressValue} className="h-2 w-full" /> */}
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex justify-between">
            <span className="text-sm text-gray-500">Analizowanie strony...</span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-gray-100">
            <div className="animate-pulse-x absolute inset-0 h-full w-1/3 rounded-full bg-primary"></div>
          </div>
        </div>
      )}
      
      {/* Lista komunikatów */}
      <div className="max-h-40 space-y-1 overflow-y-auto rounded bg-gray-50 p-2 text-sm">
        {messages.length > 0 ? (
          messages.map((message, index) => (
            <div key={index} className="animate-fadeIn">
              {message}
            </div>
          ))
        ) : (
          <div className="text-gray-400">Oczekiwanie na rozpoczęcie...</div>
        )}
      </div>
    </div>
  )
}

// Dodaj style dla animacji do globals.css
// @keyframes pulse-x {
//   0%, 100% { transform: translateX(-100%); }
//   50% { transform: translateX(100%); }
// }
// 
// @keyframes fadeIn {
//   from { opacity: 0; }
//   to { opacity: 1; }
// }
// 
// .animate-pulse-x {
//   animation: pulse-x 1.5s infinite;
// }
// 
// .animate-fadeIn {
//   animation: fadeIn 0.3s ease-in;
// }
