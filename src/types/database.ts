/**
 * Tipe database Supabase — DIBUAT dari skema di supabase/migrations.
 * Regenerasi setelah skema berubah:  npm run db:types
 * (jangan edit manual)
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      branches: {
        Row: {
          id: string;
          code: string;
          name: string;
          address: string | null;
          phone: string | null;
          status: Database["public"]["Enums"]["branch_status"];
          open_time: string;
          close_time: string;
          manager_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          address?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["branch_status"];
          open_time?: string;
          close_time?: string;
          manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          address?: string | null;
          phone?: string | null;
          status?: Database["public"]["Enums"]["branch_status"];
          open_time?: string;
          close_time?: string;
          manager_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "branches_manager_id_fkey";
            columns: ["manager_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      customers: {
        Row: {
          id: string;
          name: string;
          phone: string;
          email: string | null;
          address: string | null;
          points: number;
          preferred_branch_id: string | null;
          notes: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          phone: string;
          email?: string | null;
          address?: string | null;
          points?: number;
          preferred_branch_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          phone?: string;
          email?: string | null;
          address?: string | null;
          points?: number;
          preferred_branch_id?: string | null;
          notes?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "customers_preferred_branch_id_fkey";
            columns: ["preferred_branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      inventory_items: {
        Row: {
          id: string;
          branch_id: string;
          name: string;
          category: string;
          unit: string;
          current_stock: number;
          min_stock: number;
          reorder_point: number;
          unit_cost: number;
          supplier: string | null;
          last_restocked: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          branch_id: string;
          name: string;
          category?: string;
          unit: string;
          current_stock?: number;
          min_stock?: number;
          reorder_point?: number;
          unit_cost?: number;
          supplier?: string | null;
          last_restocked?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          branch_id?: string;
          name?: string;
          category?: string;
          unit?: string;
          current_stock?: number;
          min_stock?: number;
          reorder_point?: number;
          unit_cost?: number;
          supplier?: string | null;
          last_restocked?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      membership_tiers: {
        Row: {
          id: string;
          name: string;
          min_points: number;
          discount_percent: number;
          color: string | null;
          benefits: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          min_points: number;
          discount_percent?: number;
          color?: string | null;
          benefits?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          min_points?: number;
          discount_percent?: number;
          color?: string | null;
          benefits?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      order_items: {
        Row: {
          id: string;
          order_id: string;
          service_id: string | null;
          service_name: string;
          unit: Database["public"]["Enums"]["service_unit"];
          unit_price: number;
          quantity: number;
          line_total: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          service_id?: string | null;
          service_name?: string;
          unit?: Database["public"]["Enums"]["service_unit"];
          unit_price?: number;
          quantity: number;
          line_total?: never;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          service_id?: string | null;
          service_name?: string;
          unit?: Database["public"]["Enums"]["service_unit"];
          unit_price?: number;
          quantity?: number;
          line_total?: never;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "order_items_service_id_fkey";
            columns: ["service_id"];
            isOneToOne: false;
            referencedRelation: "services";
            referencedColumns: ["id"];
          },
        ];
      };
      order_status_logs: {
        Row: {
          id: string;
          order_id: string;
          from_status: Database["public"]["Enums"]["order_status"] | null;
          to_status: Database["public"]["Enums"]["order_status"];
          changed_by: string | null;
          changed_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          to_status: Database["public"]["Enums"]["order_status"];
          changed_by?: string | null;
          changed_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          from_status?: Database["public"]["Enums"]["order_status"] | null;
          to_status?: Database["public"]["Enums"]["order_status"];
          changed_by?: string | null;
          changed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "order_status_logs_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
      };
      orders: {
        Row: {
          id: string;
          code: string;
          branch_id: string;
          customer_id: string;
          cashier_id: string | null;
          promo_id: string | null;
          status: Database["public"]["Enums"]["order_status"];
          subtotal: number;
          discount: number;
          total: number;
          paid_amount: number;
          payment_status: Database["public"]["Enums"]["payment_status"];
          notes: string | null;
          due_at: string | null;
          tracking_token: string;
          created_at: string;
          updated_at: string;
          completed_at: string | null;
        };
        Insert: {
          id?: string;
          code?: string;
          branch_id: string;
          customer_id: string;
          cashier_id?: string | null;
          promo_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          discount?: number;
          total?: number;
          paid_amount?: number;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          notes?: string | null;
          due_at?: string | null;
          tracking_token?: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Update: {
          id?: string;
          code?: string;
          branch_id?: string;
          customer_id?: string;
          cashier_id?: string | null;
          promo_id?: string | null;
          status?: Database["public"]["Enums"]["order_status"];
          subtotal?: number;
          discount?: number;
          total?: number;
          paid_amount?: number;
          payment_status?: Database["public"]["Enums"]["payment_status"];
          notes?: string | null;
          due_at?: string | null;
          tracking_token?: string;
          created_at?: string;
          updated_at?: string;
          completed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "orders_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_cashier_id_fkey";
            columns: ["cashier_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "orders_promo_id_fkey";
            columns: ["promo_id"];
            isOneToOne: false;
            referencedRelation: "promotions";
            referencedColumns: ["id"];
          },
        ];
      };
      payments: {
        Row: {
          id: string;
          order_id: string;
          amount: number;
          method: Database["public"]["Enums"]["payment_method"];
          received_by: string | null;
          paid_at: string;
        };
        Insert: {
          id?: string;
          order_id: string;
          amount: number;
          method?: Database["public"]["Enums"]["payment_method"];
          received_by?: string | null;
          paid_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string;
          amount?: number;
          method?: Database["public"]["Enums"]["payment_method"];
          received_by?: string | null;
          paid_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "payments_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "payments_received_by_fkey";
            columns: ["received_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
        ];
      };
      profiles: {
        Row: {
          id: string;
          full_name: string;
          phone: string | null;
          role: Database["public"]["Enums"]["app_role"];
          branch_id: string | null;
          is_active: boolean;
          commission_rate: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          branch_id?: string | null;
          is_active?: boolean;
          commission_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          phone?: string | null;
          role?: Database["public"]["Enums"]["app_role"];
          branch_id?: string | null;
          is_active?: boolean;
          commission_rate?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
        ];
      };
      promotions: {
        Row: {
          id: string;
          code: string;
          name: string;
          type: Database["public"]["Enums"]["promo_type"];
          value: number;
          min_order: number;
          max_usage: number | null;
          valid_from: string;
          valid_to: string;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          code: string;
          name: string;
          type: Database["public"]["Enums"]["promo_type"];
          value: number;
          min_order?: number;
          max_usage?: number | null;
          valid_from: string;
          valid_to: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          code?: string;
          name?: string;
          type?: Database["public"]["Enums"]["promo_type"];
          value?: number;
          min_order?: number;
          max_usage?: number | null;
          valid_from?: string;
          valid_to?: string;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      services: {
        Row: {
          id: string;
          name: string;
          category: string;
          unit: Database["public"]["Enums"]["service_unit"];
          price: number;
          est_hours: number;
          description: string | null;
          is_active: boolean;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          unit: Database["public"]["Enums"]["service_unit"];
          price: number;
          est_hours: number;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          unit?: Database["public"]["Enums"]["service_unit"];
          price?: number;
          est_hours?: number;
          description?: string | null;
          is_active?: boolean;
          sort_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { [_ in never]: never };
    Enums: {
      app_role: "admin" | "employee";
      branch_status: "active" | "maintenance" | "closed";
      order_status: "received" | "washing" | "drying" | "ironing" | "ready" | "completed";
      payment_method: "cash" | "qris" | "transfer";
      payment_status: "unpaid" | "partial" | "paid";
      promo_type: "percent" | "fixed";
      service_unit: "kg" | "pcs" | "pasang" | "m2";
    };
    CompositeTypes: { [_ in never]: never };
  };
};

type PublicSchema = Database["public"];

export type Tables<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Row"];
export type TablesInsert<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Insert"];
export type TablesUpdate<T extends keyof PublicSchema["Tables"]> = PublicSchema["Tables"][T]["Update"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
