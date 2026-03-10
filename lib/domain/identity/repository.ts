import type { SupabaseClient } from "@supabase/supabase-js";
import type { User, CreateUserInput, UpdateUserInput } from "./types";

export class IdentityRepository {
  constructor(private readonly db: SupabaseClient) {}

  async findById(id: string): Promise<User | null> {
    const { data, error } = await this.db
      .from("users")
      .select("*")
      .eq("id", id)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async findByEmail(email: string): Promise<User | null> {
    const { data, error } = await this.db
      .from("users")
      .select("*")
      .eq("email", email)
      .maybeSingle();

    if (error) throw error;
    return data;
  }

  async create(input: CreateUserInput): Promise<User> {
    const { data, error } = await this.db
      .from("users")
      .insert(input)
      .select()
      .single();

    if (error) throw error;
    return data;
  }

  async update(id: string, input: UpdateUserInput): Promise<User> {
    const { data, error } = await this.db
      .from("users")
      .update(input)
      .eq("id", id)
      .select()
      .single();

    if (error) throw error;
    return data;
  }
}
