import { UrlFormContainer } from './components/ui/UrlFormContainer'

export default function DocGenPage() {
  return (
    <div className="container mx-auto flex h-full items-center justify-center p-4">
      <div className="mx-auto max-w-2xl space-y-6">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
          <p className="mb-4 text-gray-600">
            Wygeneruj sitemap dla swojej strony internetowej, a następnie stwórz
            dokumentację.
          </p>

          <ol className="mb-6 list-decimal space-y-2 pl-5 text-gray-700">
            <li>
              <strong>Generowanie sitemap</strong> - Podaj adres URL swojej
              strony, a nasz crawler przeskanuje ją i znajdzie wszystkie
              podstrony. Po zakończeniu zobaczysz listę znalezionych stron.
            </li>
            <li>
              <strong>Generowanie dokumentacji</strong> - Po wygenerowaniu
              sitemap możesz kliknąć przycisk Wygeneruj dokumentację, aby pobrać
              zawartość HTML wszystkich znalezionych stron.
            </li>
          </ol>

          <UrlFormContainer />

          <div className="mt-8 border-t pt-4 text-xs text-gray-500">
            <p>
              <strong>Uwaga:</strong> Generator sitemap działa najlepiej na
              stronach opartych o popularne platformy (WordPress, Shopify, itp.)
              i może nie działać poprawnie na bardzo złożonych aplikacjach SPA
              lub stronach z dużą ilością treści generowanej przez JavaScript.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
