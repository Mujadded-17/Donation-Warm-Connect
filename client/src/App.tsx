import { useEffect, useState } from "react";

function App() {
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetch("http://127.0.0.1:8000/api/items")
      .then((res) => res.json())
      .then((data) => setItems(data))
      .catch((err) => console.error(err));
  }, []);

  return (
    <div>
      <h1>Donation Items</h1>

      {items.map((item) => (
        <div key={item.item_id}>
          <h3>{item.title}</h3>
          <p>{item.description}</p>
        </div>
      ))}

    </div>
  );
}

export default App;