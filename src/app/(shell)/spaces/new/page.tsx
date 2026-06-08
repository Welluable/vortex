"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { BlankMain } from "@/components/shell/blank-main";
import { Button } from "@/components/ui/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function NewSpacePage() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [nameError, setNameError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setNameError(null);
    setFormError(null);

    if (!name.trim()) {
      setNameError("Name is required");
      return;
    }

    const res = await fetch("/api/spaces", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, description: description || undefined }),
    });
    if (!res.ok) {
      setFormError("Failed to create space");
      return;
    }
    const space = await res.json();
    router.push(`/spaces/${space.id}`);
    router.refresh();
  }

  return (
    <BlankMain>
      <form onSubmit={onSubmit}>
        <FieldGroup className="mx-auto max-w-md gap-6 p-6">
          <Field data-invalid={nameError ? true : undefined}>
            <FieldLabel htmlFor="name">Name</FieldLabel>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              aria-invalid={nameError ? true : undefined}
              required
            />
            <FieldDescription>The display name for this space.</FieldDescription>
            <FieldError>{nameError}</FieldError>
          </Field>

          <Field>
            <FieldLabel htmlFor="description">Description</FieldLabel>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
            />
            <FieldDescription>Optional details about what this space is for.</FieldDescription>
          </Field>

          {formError && <FieldError>{formError}</FieldError>}

          <Button type="submit">Create space</Button>
        </FieldGroup>
      </form>
    </BlankMain>
  );
}
