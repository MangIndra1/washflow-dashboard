/**
 * Tipe database Supabase, dibuat dari skema di supabase/migrations.
 * Regenerasi setelah skema berubah:  npm run db:types
 * (jangan edit manual)
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      automation_settings: {
        Row: {
          id: boolean;
          wa_notify_enabled: boolean;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: boolean;
          wa_notify_enabled?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: boolean;
          wa_notify_enabled?: boolean;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
      };
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
      commission_entries: {
        Row: {
          id: string;
          order_id: string | null;
          order_code: string;
          employee_id: string | null;
          employee_name: string;
          branch_id: string | null;
          base_amount: number;
          rate: number;
          amount: number;
          source: string;
          earned_at: string;
          payout_id: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          order_id?: string | null;
          order_code: string;
          employee_id?: string | null;
          employee_name: string;
          branch_id?: string | null;
          base_amount: number;
          rate: number;
          amount: number;
          source?: string;
          earned_at?: string;
          payout_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          order_id?: string | null;
          order_code?: string;
          employee_id?: string | null;
          employee_name?: string;
          branch_id?: string | null;
          base_amount?: number;
          rate?: number;
          amount?: number;
          source?: string;
          earned_at?: string;
          payout_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "commission_entries_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_entries_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_entries_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_entries_payout_id_fkey";
            columns: ["payout_id"];
            isOneToOne: false;
            referencedRelation: "commission_payouts";
            referencedColumns: ["id"];
          },
        ];
      };
      commission_payouts: {
        Row: {
          id: string;
          employee_id: string | null;
          employee_name: string;
          period_from: string;
          period_to: string;
          total: number;
          entry_count: number;
          note: string | null;
          paid_at: string;
          paid_by: string | null;
          voided_at: string | null;
          voided_by: string | null;
        };
        Insert: {
          id?: string;
          employee_id?: string | null;
          employee_name: string;
          period_from: string;
          period_to: string;
          total: number;
          entry_count: number;
          note?: string | null;
          paid_at?: string;
          paid_by?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Update: {
          id?: string;
          employee_id?: string | null;
          employee_name?: string;
          period_from?: string;
          period_to?: string;
          total?: number;
          entry_count?: number;
          note?: string | null;
          paid_at?: string;
          paid_by?: string | null;
          voided_at?: string | null;
          voided_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "commission_payouts_employee_id_fkey";
            columns: ["employee_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_payouts_paid_by_fkey";
            columns: ["paid_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "commission_payouts_voided_by_fkey";
            columns: ["voided_by"];
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
      inventory_catalog: {
        Row: {
          id: string;
          name: string;
          category: string;
          unit: string;
          unit_cost: number;
          supplier: string | null;
          default_min_stock: number;
          default_reorder_point: number;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          category?: string;
          unit: string;
          unit_cost?: number;
          supplier?: string | null;
          default_min_stock?: number;
          default_reorder_point?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          category?: string;
          unit?: string;
          unit_cost?: number;
          supplier?: string | null;
          default_min_stock?: number;
          default_reorder_point?: number;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
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
          is_active: boolean;
          catalog_id: string;
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
          is_active?: boolean;
          catalog_id: string;
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
          is_active?: boolean;
          catalog_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "inventory_items_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "inventory_items_catalog_id_fkey";
            columns: ["catalog_id"];
            isOneToOne: false;
            referencedRelation: "inventory_catalog";
            referencedColumns: ["id"];
          },
        ];
      };
      loyalty_settings: {
        Row: {
          id: boolean;
          enabled: boolean;
          rupiah_per_point: number;
          updated_at: string;
        };
        Insert: {
          id?: boolean;
          enabled?: boolean;
          rupiah_per_point?: number;
          updated_at?: string;
        };
        Update: {
          id?: boolean;
          enabled?: boolean;
          rupiah_per_point?: number;
          updated_at?: string;
        };
        Relationships: [];
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
      notifications: {
        Row: {
          id: string;
          order_id: string;
          kind: string;
          status: string;
          attempts: number;
          next_attempt_at: string;
          locked_at: string | null;
          wa_message_id: string | null;
          error: string | null;
          created_at: string;
          sent_at: string | null;
        };
        Insert: {
          id?: string;
          order_id: string;
          kind?: string;
          status?: string;
          attempts?: number;
          next_attempt_at?: string;
          locked_at?: string | null;
          wa_message_id?: string | null;
          error?: string | null;
          created_at?: string;
          sent_at?: string | null;
        };
        Update: {
          id?: string;
          order_id?: string;
          kind?: string;
          status?: string;
          attempts?: number;
          next_attempt_at?: string;
          locked_at?: string | null;
          wa_message_id?: string | null;
          error?: string | null;
          created_at?: string;
          sent_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "notifications_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: false;
            referencedRelation: "orders";
            referencedColumns: ["id"];
          },
        ];
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
          discount_label: string | null;
          client_key: string | null;
          track_token: string;
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
          discount_label?: string | null;
          client_key?: string | null;
          track_token?: string;
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
          discount_label?: string | null;
          client_key?: string | null;
          track_token?: string;
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
      payment_info: {
        Row: {
          id: boolean;
          qris_payload: string | null;
          qris_merchant: string | null;
          banks: Json;
          note: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          id?: boolean;
          qris_payload?: string | null;
          qris_merchant?: string | null;
          banks?: Json;
          note?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          id?: boolean;
          qris_payload?: string | null;
          qris_merchant?: string | null;
          banks?: Json;
          note?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [];
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
      points_log: {
        Row: {
          id: string;
          customer_id: string;
          order_id: string | null;
          kind: string;
          points: number;
          balance_after: number;
          note: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          customer_id: string;
          order_id?: string | null;
          kind: string;
          points: number;
          balance_after: number;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          customer_id?: string;
          order_id?: string | null;
          kind?: string;
          points?: number;
          balance_after?: number;
          note?: string | null;
          created_by?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "points_log_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_log_customer_id_fkey";
            columns: ["customer_id"];
            isOneToOne: false;
            referencedRelation: "customers";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "points_log_order_id_fkey";
            columns: ["order_id"];
            isOneToOne: true;
            referencedRelation: "orders";
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
          email: string | null;
          job_title: string;
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
          email?: string | null;
          job_title?: string;
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
          email?: string | null;
          job_title?: string;
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
      stock_movements: {
        Row: {
          id: string;
          item_id: string;
          branch_id: string;
          kind: string;
          quantity: number;
          balance_after: number;
          note: string | null;
          created_by: string | null;
          created_by_name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          item_id: string;
          branch_id: string;
          kind: string;
          quantity: number;
          balance_after: number;
          note?: string | null;
          created_by?: string | null;
          created_by_name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          item_id?: string;
          branch_id?: string;
          kind?: string;
          quantity?: number;
          balance_after?: number;
          note?: string | null;
          created_by?: string | null;
          created_by_name?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "stock_movements_branch_id_fkey";
            columns: ["branch_id"];
            isOneToOne: false;
            referencedRelation: "branches";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_created_by_fkey";
            columns: ["created_by"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "stock_movements_item_id_fkey";
            columns: ["item_id"];
            isOneToOne: false;
            referencedRelation: "inventory_items";
            referencedColumns: ["id"];
          },
        ];
      };
    };
    Views: {
      branch_stats: {
        Row: {
          branch_id: string | null;
          orders_today: number | null;
          orders_30d: number | null;
          revenue_30d: number | null;
          customers_count: number | null;
        };
        Relationships: [];
      };
      customer_stats: {
        Row: {
          customer_id: string | null;
          orders_count: number | null;
          total_spent: number | null;
          last_visit: string | null;
        };
        Relationships: [];
      };
      employee_stats: {
        Row: {
          profile_id: string | null;
          orders_30d: number | null;
          commission_30d: number | null;
        };
        Relationships: [];
      };
      promotion_stats: {
        Row: {
          promo_id: string | null;
          usage_count: number | null;
          discount_total: number | null;
          last_used_at: string | null;
        };
        Relationships: [];
      };
      service_stats: {
        Row: {
          service_id: string | null;
          orders_30d: number | null;
          revenue_30d: number | null;
        };
        Relationships: [];
      };
      tier_stats: {
        Row: {
          tier_id: string | null;
          member_count: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      create_order: {
        Args: {
          p_branch_id?: string;
          p_client_key?: string;
          p_customer_id: string;
          p_items: Json;
          p_notes?: string;
          p_pay_amount?: number;
          p_pay_method?: Database["public"]["Enums"]["payment_method"];
          p_promo_code?: string;
        };
        Returns: string;
      };
      track_order: {
        Args: { p_token: string };
        Returns: Json;
      };
      admin_report: {
        Args: { p_branch?: string; p_from: string; p_to: string; p_tz?: string };
        Returns: Json;
      };
      adjust_points: {
        Args: { p_customer_id: string; p_delta: number; p_note: string };
        Returns: number;
      };
      recalc_loyalty_points: {
        Args: Record<PropertyKey, never>;
        Returns: Json;
      };
      recalc_commissions: {
        Args: { p_since?: string };
        Returns: Json;
      };
      pay_commissions: {
        Args: { p_employee_id: string; p_from: string; p_to: string; p_note?: string; p_tz?: string };
        Returns: Json;
      };
      void_commission_payout: {
        Args: { p_payout_id: string };
        Returns: number;
      };
      commission_report: {
        Args: { p_branch?: string; p_from: string; p_to: string };
        Returns: Json;
      };
      transfer_stock: {
        Args: { p_item_id: string; p_to_branch: string; p_qty: number; p_note?: string };
        Returns: number;
      };
      transfer_destinations: {
        Args: { p_item_id: string };
        Returns: { branch_id: string; branch_name: string; branch_code: string }[];
      };
      record_stock: {
        Args: { p_item_id: string; p_kind: string; p_qty: number; p_note?: string };
        Returns: number;
      };
      quote_order: {
        Args: { p_customer_id: string; p_items: Json; p_promo_code?: string };
        Returns: Json;
      };
      record_payment: {
        Args: {
          p_amount: number;
          p_method?: Database["public"]["Enums"]["payment_method"];
          p_order_id: string;
        };
        Returns: undefined;
      };
    };
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
export type Views<T extends keyof PublicSchema["Views"]> = PublicSchema["Views"][T]["Row"];
export type Enums<T extends keyof PublicSchema["Enums"]> = PublicSchema["Enums"][T];
