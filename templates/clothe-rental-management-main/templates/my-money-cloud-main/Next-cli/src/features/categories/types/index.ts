export interface CategoryRow {
  id: string;
  user_id: string | null;
  name: string;
  icon?: string | null;
  color?: string | null;
  created_at: string;
  anon_key?: string | null;
}

export interface CategoryInput {
  id?: string;
  user_id?: string | null;
  name: string;
  icon?: string;
  color?: string;
}
