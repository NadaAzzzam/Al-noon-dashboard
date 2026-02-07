import { useEffect, useState } from "react";
import { api, ApiError, Product, clearAuth } from "../services/api";

const InventoryPage = () => {
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [outOfStock, setOutOfStock] = useState<Product[]>([]);
  const [threshold, setThreshold] = useState(5);
  const [editingStock, setEditingStock] = useState<{ id: string; value: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setError(null);
    try {
      const [lowRes, outRes] = await Promise.all([
        api.getLowStockProducts(),
        api.getOutOfStockProducts()
      ]);
      setLowStock(lowRes.products ?? []);
      setOutOfStock(outRes.products ?? []);
      setThreshold(lowRes.threshold ?? 5);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearAuth();
        window.location.href = "/login";
        return;
      }
      setError(err instanceof ApiError ? err.message : "Failed to load inventory");
    }
  };

  useEffect(() => { load(); }, []);

  const saveStock = async (id: string, stock: number) => {
    setError(null);
    try {
      await api.updateProductStock(id, stock);
      setEditingStock(null);
      load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update stock");
    }
  };

  return (
    <div>
      {error && <div className="error" style={{ marginBottom: 16 }}>{error}</div>}
      <div className="header">
        <h1>Inventory</h1>
        <p>Low stock threshold: {threshold}. Update stock manually.</p>
      </div>
      <div className="card" style={{ marginBottom: 24 }}>
        <h3>Low stock</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {lowStock.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{typeof p.category === "object" && p.category ? p.category.name : ""}</td>
                <td>
                  {editingStock?.id === p._id ? (
                    <input
                      type="number"
                      min={0}
                      value={editingStock.value}
                      onChange={(e) => setEditingStock({ id: p._id, value: Number(e.target.value) })}
                      onBlur={() => editingStock && saveStock(p._id, editingStock.value)}
                    />
                  ) : (
                    <span className="badge" style={{ background: "#fef3c7", color: "#92400e" }}>{p.stock}</span>
                  )}
                </td>
                <td>
                  {editingStock?.id === p._id ? (
                    <button className="button" onClick={() => editingStock && saveStock(p._id, editingStock.value)}>Save</button>
                  ) : (
                    <button className="button secondary" onClick={() => setEditingStock({ id: p._id, value: p.stock })}>Edit</button>
                  )}
                </td>
              </tr>
            ))}
            {!lowStock.length && <tr><td colSpan={4}>No low stock items</td></tr>}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>Out of stock</h3>
        <table className="table">
          <thead>
            <tr>
              <th>Product</th>
              <th>Category</th>
              <th>Stock</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {outOfStock.map((p) => (
              <tr key={p._id}>
                <td>{p.name}</td>
                <td>{typeof p.category === "object" && p.category ? p.category.name : ""}</td>
                <td><span className="badge" style={{ background: "#fee2e2", color: "#991b1b" }}>0</span></td>
                <td>
                  {editingStock?.id === p._id ? (
                    <>
                      <input
                        type="number"
                        min={0}
                        value={editingStock.value}
                        onChange={(e) => setEditingStock({ id: p._id, value: Number(e.target.value) })}
                      />
                      <button className="button" onClick={() => editingStock && saveStock(p._id, editingStock.value)}>Save</button>
                    </>
                  ) : (
                    <button className="button secondary" onClick={() => setEditingStock({ id: p._id, value: 0 })}>Update stock</button>
                  )}
                </td>
              </tr>
            ))}
            {!outOfStock.length && <tr><td colSpan={4}>No out of stock items</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryPage;
