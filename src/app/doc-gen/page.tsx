import { UrlForm } from "./components/ui/UrlForm";

export default function DocGenPage() {
  return (
    <div className="container mx-auto p-4">
      <h1 className="mb-4 text-2xl font-bold">Generator dokumentacji</h1>
      <div className="grid gap-8 md:grid-cols-1">
        <div className="space-y-6 max-w-2xl mx-auto">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
            <h2 className="mb-2 text-xl font-semibold">Generator dokumentacji</h2>
            <p className="mb-4 text-gray-600">
              Wygeneruj dokumentację dla swojej strony internetowej. Proces przebiega w dwóch krokach:
            </p>
            
            <ol className="list-decimal pl-5 mb-6 text-gray-700 space-y-2">
              <li>
                <strong>Generowanie sitemap</strong> - Podaj adres URL swojej strony, a nasz crawler 
                przeskanuje ją i znajdzie wszystkie podstrony. Po zakończeniu zobaczysz listę znalezionych stron.
              </li>
              <li>
                <strong>Generowanie dokumentacji</strong> - Po zaakceptowaniu sitemap, nasz system 
                przeskanuje zawartość każdej znalezionej podstrony i wygeneruje dokumentację.
              </li>
            </ol>
            
            <UrlForm type="sitemap" />
            
            <div className="mt-8 border-t pt-4 text-xs text-gray-500">
              <p>
                <strong>Uwaga:</strong> Generator dokumentacji działa najlepiej na stronach opartych o popularne 
                platformy (WordPress, Shopify, itp.) i może nie działać poprawnie na bardzo złożonych aplikacjach 
                SPA lub stronach z dużą ilością treści generowanej przez JavaScript.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
