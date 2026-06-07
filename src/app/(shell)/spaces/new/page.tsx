"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BlankMain } from "@/components/shell/blank-main";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function NewSpacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) {
      setError("Name is required");
      return;
    }
    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    if (!res.ok) {
      setError("Failed to create space");
      return;
    }
    const space = await res.json();
    router.push(`/spaces/${space.id}`);
    router.refresh();
  }

  return (
    <BlankMain>
      <form onSubmit={onSubmit} className="mx-auto flex max-w-md flex-col gap-4 p-6">
        <div>
          <Label htmlFor="name">Name</Label>
          <Input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <Label htmlFor="description">Description</Label>
          <Input id="description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button type="submit">Create space</Button>
      </form>
    </BlankMain>
  );
}
