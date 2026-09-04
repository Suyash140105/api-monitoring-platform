import { useCallback, useRef, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function Layout() {
  const [searchTerm, setSearchTerm] = useState("");
  const addClickRef = useRef(null);

  const registerAddClick = useCallback((handler) => {
    addClickRef.current = handler;
  }, []);

  return (
    <div className="flex min-h-screen bg-background text-foreground dark">
      <Sidebar />

      <main className="flex-1">
        <Header
          onAddClick={() => addClickRef.current?.()}
          searchTerm={searchTerm}
          setSearchTerm={setSearchTerm}
        />

        <Outlet context={{ searchTerm, registerAddClick }} />
      </main>
    </div>
  );
}
