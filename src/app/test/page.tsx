export default function TestPage() {
  return (
    <main className="flex flex-col h-full bg-blue-900 text-white">
      <header className="p-4 bg-gray-800">
        <h1 className="text-xl font-bold">TEST HEADER</h1>
      </header>

      <div className="flex-1 bg-green-700 p-8">
        <h2 className="text-3xl">MAIN CONTENT AREA</h2>
        <p>If you can see this green box, then your basic layout and CSS are working.</p>
      </div>

      <footer className="p-4 bg-gray-800">
        <p>Test Footer</p>
      </footer>
    </main>
  );
}