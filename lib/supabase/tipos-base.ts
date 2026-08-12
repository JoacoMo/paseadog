/**
 * Tipos de la base de datos.
 *
 * Regenerar con:
 *   npm run tipos
 *
 * Ese comando necesita SUPABASE_PROJECT_ID en el entorno (el "Reference ID" que
 * figura en Supabase → Project Settings → General).
 *
 * Esta primera versión está escrita a mano a partir del esquema SQL, para poder
 * tipar desde el día uno sin depender de tener el CLI logueado. Cuando corras
 * `npm run tipos` se pisa con la salida real del generador; si algo difiere,
 * gana la generada.
 *
 * Las columnas PostGIS (`geography`) quedan como `unknown` a propósito, que es
 * lo que produce el generador. Encaja con la regla del proyecto: la ubicación
 * exacta no se manipula desde el cliente. Lo único que sale de la base es la
 * distancia en metros, vía buscar_paseadores().
 */

export type Json = string | number | boolean | null | { [clave: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      perfiles: {
        Row: {
          id: string;
          nombre: string;
          telefono: string | null;
          foto_url: string | null;
          barrio: string | null;
          es_dueno: boolean;
          es_paseador: boolean;
          verificado: boolean;
          creado_en: string;
        };
        Insert: {
          id: string;
          nombre: string;
          telefono?: string | null;
          foto_url?: string | null;
          barrio?: string | null;
          es_dueno?: boolean;
          es_paseador?: boolean;
          verificado?: boolean;
          creado_en?: string;
        };
        Update: {
          id?: string;
          nombre?: string;
          telefono?: string | null;
          foto_url?: string | null;
          barrio?: string | null;
          es_dueno?: boolean;
          es_paseador?: boolean;
          verificado?: boolean;
          creado_en?: string;
        };
        Relationships: [];
      };
      ubicaciones: {
        Row: {
          perfil_id: string;
          punto: unknown;
          direccion: string | null;
          actualizado_en: string;
        };
        Insert: {
          perfil_id: string;
          punto: unknown;
          direccion?: string | null;
          actualizado_en?: string;
        };
        Update: {
          perfil_id?: string;
          punto?: unknown;
          direccion?: string | null;
          actualizado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'ubicaciones_perfil_id_fkey';
            columns: ['perfil_id'];
            isOneToOne: true;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
        ];
      };
      perfiles_paseador: {
        Row: {
          id: string;
          bio: string | null;
          kg_max: number;
          perros_simultaneos: number;
          radio_km: number;
          maneja_reactivos: boolean;
          maneja_cachorros: boolean;
          maneja_senior: boolean;
          acepta_no_castrados: boolean;
          arnes_antiescape: boolean;
          acepta_grupal: boolean;
          ritmo: Database['public']['Enums']['nivel_energia'];
          experiencia_anios: number;
          tarifa_individual: number;
          tarifa_grupal: number | null;
          activo: boolean;
        };
        Insert: {
          id: string;
          bio?: string | null;
          kg_max?: number;
          perros_simultaneos?: number;
          radio_km?: number;
          maneja_reactivos?: boolean;
          maneja_cachorros?: boolean;
          maneja_senior?: boolean;
          acepta_no_castrados?: boolean;
          arnes_antiescape?: boolean;
          acepta_grupal?: boolean;
          ritmo?: Database['public']['Enums']['nivel_energia'];
          experiencia_anios?: number;
          tarifa_individual: number;
          tarifa_grupal?: number | null;
          activo?: boolean;
        };
        Update: {
          id?: string;
          bio?: string | null;
          kg_max?: number;
          perros_simultaneos?: number;
          radio_km?: number;
          maneja_reactivos?: boolean;
          maneja_cachorros?: boolean;
          maneja_senior?: boolean;
          acepta_no_castrados?: boolean;
          arnes_antiescape?: boolean;
          acepta_grupal?: boolean;
          ritmo?: Database['public']['Enums']['nivel_energia'];
          experiencia_anios?: number;
          tarifa_individual?: number;
          tarifa_grupal?: number | null;
          activo?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'perfiles_paseador_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
        ];
      };
      perros: {
        Row: {
          id: string;
          dueno_id: string;
          nombre: string;
          foto_url: string | null;
          raza: string | null;
          porte: Database['public']['Enums']['porte_perro'];
          kg: number;
          nacimiento: string | null;
          energia: Database['public']['Enums']['nivel_energia'];
          castrado: boolean;
          tira_correa: boolean;
          reactivo_perros: boolean;
          reactivo_gente: boolean;
          escapista: boolean;
          braquicefalo: boolean;
          sociable_grupo: boolean;
          vacunas_al_dia: boolean;
          medicacion: string | null;
          notas: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          dueno_id: string;
          nombre: string;
          foto_url?: string | null;
          raza?: string | null;
          porte: Database['public']['Enums']['porte_perro'];
          kg: number;
          nacimiento?: string | null;
          energia?: Database['public']['Enums']['nivel_energia'];
          castrado?: boolean;
          tira_correa?: boolean;
          reactivo_perros?: boolean;
          reactivo_gente?: boolean;
          escapista?: boolean;
          braquicefalo?: boolean;
          sociable_grupo?: boolean;
          vacunas_al_dia?: boolean;
          medicacion?: string | null;
          notas?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          dueno_id?: string;
          nombre?: string;
          foto_url?: string | null;
          raza?: string | null;
          porte?: Database['public']['Enums']['porte_perro'];
          kg?: number;
          nacimiento?: string | null;
          energia?: Database['public']['Enums']['nivel_energia'];
          castrado?: boolean;
          tira_correa?: boolean;
          reactivo_perros?: boolean;
          reactivo_gente?: boolean;
          escapista?: boolean;
          braquicefalo?: boolean;
          sociable_grupo?: boolean;
          vacunas_al_dia?: boolean;
          medicacion?: string | null;
          notas?: string | null;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'perros_dueno_id_fkey';
            columns: ['dueno_id'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
        ];
      };
      disponibilidad: {
        Row: {
          id: string;
          paseador_id: string;
          dia_semana: number;
          desde: string;
          hasta: string;
        };
        Insert: {
          id?: string;
          paseador_id: string;
          dia_semana: number;
          desde: string;
          hasta: string;
        };
        Update: {
          id?: string;
          paseador_id?: string;
          dia_semana?: number;
          desde?: string;
          hasta?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'disponibilidad_paseador_id_fkey';
            columns: ['paseador_id'];
            isOneToOne: false;
            referencedRelation: 'perfiles_paseador';
            referencedColumns: ['id'];
          },
        ];
      };
      reservas: {
        Row: {
          id: string;
          perro_id: string;
          dueno_id: string;
          paseador_id: string;
          inicio: string;
          duracion_min: number;
          tipo: Database['public']['Enums']['tipo_paseo'];
          estado: Database['public']['Enums']['estado_reserva'];
          precio: number;
          direccion_retiro: string | null;
          nota_dueno: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          perro_id: string;
          dueno_id: string;
          paseador_id: string;
          inicio: string;
          duracion_min?: number;
          tipo?: Database['public']['Enums']['tipo_paseo'];
          estado?: Database['public']['Enums']['estado_reserva'];
          precio: number;
          direccion_retiro?: string | null;
          nota_dueno?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          perro_id?: string;
          dueno_id?: string;
          paseador_id?: string;
          inicio?: string;
          duracion_min?: number;
          tipo?: Database['public']['Enums']['tipo_paseo'];
          estado?: Database['public']['Enums']['estado_reserva'];
          precio?: number;
          direccion_retiro?: string | null;
          nota_dueno?: string | null;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'reservas_perro_id_fkey';
            columns: ['perro_id'];
            isOneToOne: false;
            referencedRelation: 'perros';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reservas_dueno_id_fkey';
            columns: ['dueno_id'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'reservas_paseador_id_fkey';
            columns: ['paseador_id'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
        ];
      };
      paseos: {
        Row: {
          id: string;
          reserva_id: string;
          arranco_en: string | null;
          punto_inicio: unknown | null;
          foto_inicio: string | null;
          termino_en: string | null;
          punto_fin: unknown | null;
          foto_fin: string | null;
          hizo_pis: boolean | null;
          hizo_caca: boolean | null;
          tomo_agua: boolean | null;
          incidentes: string | null;
          fotos: string[];
        };
        Insert: {
          id?: string;
          reserva_id: string;
          arranco_en?: string | null;
          punto_inicio?: unknown | null;
          foto_inicio?: string | null;
          termino_en?: string | null;
          punto_fin?: unknown | null;
          foto_fin?: string | null;
          hizo_pis?: boolean | null;
          hizo_caca?: boolean | null;
          tomo_agua?: boolean | null;
          incidentes?: string | null;
          fotos?: string[];
        };
        Update: {
          id?: string;
          reserva_id?: string;
          arranco_en?: string | null;
          punto_inicio?: unknown | null;
          foto_inicio?: string | null;
          termino_en?: string | null;
          punto_fin?: unknown | null;
          foto_fin?: string | null;
          hizo_pis?: boolean | null;
          hizo_caca?: boolean | null;
          tomo_agua?: boolean | null;
          incidentes?: string | null;
          fotos?: string[];
        };
        Relationships: [
          {
            foreignKeyName: 'paseos_reserva_id_fkey';
            columns: ['reserva_id'];
            isOneToOne: true;
            referencedRelation: 'reservas';
            referencedColumns: ['id'];
          },
        ];
      };
      mensajes: {
        Row: {
          id: number;
          reserva_id: string;
          autor_id: string;
          texto: string;
          enviado_en: string;
        };
        Insert: {
          id?: number;
          reserva_id: string;
          autor_id: string;
          texto: string;
          enviado_en?: string;
        };
        Update: {
          id?: number;
          reserva_id?: string;
          autor_id?: string;
          texto?: string;
          enviado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'mensajes_reserva_id_fkey';
            columns: ['reserva_id'];
            isOneToOne: false;
            referencedRelation: 'reservas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'mensajes_autor_id_fkey';
            columns: ['autor_id'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
        ];
      };
      resenas: {
        Row: {
          id: string;
          reserva_id: string;
          autor_id: string;
          destinatario_id: string;
          puntaje: number;
          comentario: string | null;
          creado_en: string;
        };
        Insert: {
          id?: string;
          reserva_id: string;
          autor_id: string;
          destinatario_id: string;
          puntaje: number;
          comentario?: string | null;
          creado_en?: string;
        };
        Update: {
          id?: string;
          reserva_id?: string;
          autor_id?: string;
          destinatario_id?: string;
          puntaje?: number;
          comentario?: string | null;
          creado_en?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'resenas_reserva_id_fkey';
            columns: ['reserva_id'];
            isOneToOne: false;
            referencedRelation: 'reservas';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resenas_autor_id_fkey';
            columns: ['autor_id'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resenas_destinatario_id_fkey';
            columns: ['destinatario_id'];
            isOneToOne: false;
            referencedRelation: 'perfiles';
            referencedColumns: ['id'];
          },
        ];
      };
      rutas: {
        Row: {
          id: string;
          barrio: string;
          nombre: string;
          descripcion: string | null;
          trazado: unknown;
          distancia_m: number;
          minutos_estimados: number;
          tiene_sombra: boolean;
          tiene_bebedero: boolean;
          tiene_canil: boolean;
          apta_energia: Database['public']['Enums']['nivel_energia'][];
          kg_max: number | null;
        };
        Insert: {
          id?: string;
          barrio: string;
          nombre: string;
          descripcion?: string | null;
          trazado: unknown;
          distancia_m: number;
          minutos_estimados: number;
          tiene_sombra?: boolean;
          tiene_bebedero?: boolean;
          tiene_canil?: boolean;
          apta_energia?: Database['public']['Enums']['nivel_energia'][];
          kg_max?: number | null;
        };
        Update: {
          id?: string;
          barrio?: string;
          nombre?: string;
          descripcion?: string | null;
          trazado?: unknown;
          distancia_m?: number;
          minutos_estimados?: number;
          tiene_sombra?: boolean;
          tiene_bebedero?: boolean;
          tiene_canil?: boolean;
          apta_energia?: Database['public']['Enums']['nivel_energia'][];
          kg_max?: number | null;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      duracion_recomendada: {
        Args: { p_perro_id: string };
        Returns: number;
      };
      buscar_paseadores: {
        Args: {
          p_perro_id: string;
          p_radio_km?: number;
          p_tipo?: Database['public']['Enums']['tipo_paseo'];
        };
        Returns: {
          paseador_id: string;
          nombre: string;
          foto_url: string | null;
          barrio: string | null;
          verificado: boolean;
          distancia_m: number;
          tarifa: number;
          experiencia_anios: number;
          puntaje_promedio: number;
          cantidad_resenas: number;
          score: number;
        }[];
      };
      rutas_para: {
        Args: { p_perro_id: string };
        Returns: Database['public']['Tables']['rutas']['Row'][];
      };
      iniciar_paseo: {
        Args: {
          p_reserva_id: string;
          p_lat?: number;
          p_lng?: number;
          p_foto?: string;
        };
        Returns: Database['public']['Tables']['paseos']['Row'];
      };
      finalizar_paseo: {
        Args: {
          p_paseo_id: string;
          p_lat?: number;
          p_lng?: number;
          p_foto?: string;
        };
        Returns: Database['public']['Tables']['paseos']['Row'];
      };
      resumen_paseo: {
        Args: { p_paseo_id: string };
        Returns: {
          duracion_min: number;
          salio_de_casa: boolean;
          metros_hasta_inicio: number | null;
          volvio_a_casa: boolean;
          con_foto_inicio: boolean;
          con_foto_fin: boolean;
        }[];
      };
    };
    Enums: {
      porte_perro: 'mini' | 'chico' | 'mediano' | 'grande' | 'gigante';
      nivel_energia: 'bajo' | 'medio' | 'alto';
      tipo_paseo: 'individual' | 'grupal';
      estado_reserva:
        | 'pendiente'
        | 'aceptada'
        | 'rechazada'
        | 'cancelada'
        | 'en_curso'
        | 'finalizada';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// ------------------------------------------------------------------ Atajos

type Publico = Database['public'];

export type Tabla<N extends keyof Publico['Tables']> = Publico['Tables'][N]['Row'];
export type Insertar<N extends keyof Publico['Tables']> = Publico['Tables'][N]['Insert'];
export type Actualizar<N extends keyof Publico['Tables']> = Publico['Tables'][N]['Update'];
export type Enum<N extends keyof Publico['Enums']> = Publico['Enums'][N];

export type Perfil = Tabla<'perfiles'>;
export type Perro = Tabla<'perros'>;
export type Reserva = Tabla<'reservas'>;
export type PerfilPaseador = Tabla<'perfiles_paseador'>;

export type PortePerro = Enum<'porte_perro'>;
export type NivelEnergia = Enum<'nivel_energia'>;
export type TipoPaseo = Enum<'tipo_paseo'>;
export type EstadoReserva = Enum<'estado_reserva'>;
