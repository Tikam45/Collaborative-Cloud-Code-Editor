"import './App.css'\nimport { useState } from 'react'\n\nfunction App() {\n\n  const [count, setCount] = useState(0)\n\n  return (\n    <div>\n      <h1>React Starter Code</h1>\n      <p>\n        Edit App.jsx to get started.\n      </p>\n      <button onClick={() => setCount(count => count + 1)}>\n        Clicked {count} times\n      </button>\n    </div>\n  )\n}\n\nexport default App\n"