/**
 * Servicio de Facturación Electrónica
 * Maneja ambos modos: regular (ticket) y electrónico (factura a Hacienda)
 */

import { createClient } from '@/lib/supabase/client';
import type {
  BusinessInfo,
  ElectronicDocument,
  DocumentType,
  DocumentStatus,
  InvoiceMode,
  InvoiceReceptor,
  InvoiceConfig,
  CreateElectronicDocumentInput,
} from '../types';
import { DOCUMENT_TYPES, INVOICE_MODES } from '../types';
import { generateNumericKey, generateConsecutive } from '../utils/keyGenerator';

// Mapeo de filas de BD a tipos TypeScript
interface BusinessInfoRow {
  id: string;
  legal_name: string;
  trade_name: string | null;
  id_type: string;
  id_number: string;
  activity_code: string | null;
  activity_description: string | null;
  province: string | null;
  canton: string | null;
  district: string | null;
  neighborhood: string | null;
  other_address: string | null;
  phone: string | null;
  fax: string | null;
  email: string | null;
  fe_enabled: boolean;
  fe_environment: string;
  fe_atv_user: string | null;
  consecutive_factura: number;
  consecutive_tiquete: number;
  consecutive_nc: number;
  consecutive_nd: number;
  branch_code: string;
  terminal_code: string;
  created_at: string;
  updated_at: string;
}

interface ElectronicDocumentRow {
  id: string;
  sale_id: string | null;
  numeric_key: string;
  document_type: string;
  consecutive: string;
  receptor_name: string | null;
  receptor_id_type: string | null;
  receptor_id_number: string | null;
  receptor_email: string | null;
  status: string;
  xml_content: string | null;
  xml_response: string | null;
  hacienda_status: string | null;
  hacienda_message: string | null;
  hacienda_detail: string | null;
  emission_date: string;
  sent_date: string | null;
  response_date: string | null;
  invoice_mode: string;
  created_at: string;
  updated_at: string;
}

class InvoiceService {
  private supabase = createClient();

  // =====================================================
  // CONFIGURACIÓN
  // =====================================================

  /**
   * Obtener configuración de facturación
   */
  async getInvoiceConfig(): Promise<InvoiceConfig> {
    try {
      const { data, error } = await this.supabase
        .from('system_config')
        .select('key, value')
        .in('key', ['fe_default_mode', 'fe_auto_send', 'fe_print_on_accept', 'fe_contingency_enabled']);

      if (error) throw error;

      const config: InvoiceConfig = {
        defaultMode: 'regular',
        autoSend: false,
        printOnAccept: true,
        contingencyEnabled: true,
      };

      data?.forEach((row) => {
        switch (row.key) {
          case 'fe_default_mode':
            config.defaultMode = row.value as InvoiceMode;
            break;
          case 'fe_auto_send':
            config.autoSend = row.value === 'true';
            break;
          case 'fe_print_on_accept':
            config.printOnAccept = row.value === 'true';
            break;
          case 'fe_contingency_enabled':
            config.contingencyEnabled = row.value === 'true';
            break;
        }
      });

      return config;
    } catch (error) {
      console.error('[InvoiceService] Error getting config:', error);
      return {
        defaultMode: 'regular',
        autoSend: false,
        printOnAccept: true,
        contingencyEnabled: true,
      };
    }
  }

  /**
   * Actualizar configuración de facturación
   */
  async updateInvoiceConfig(config: Partial<InvoiceConfig>): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: { key: string; value: string }[] = [];

      if (config.defaultMode !== undefined) {
        updates.push({ key: 'fe_default_mode', value: config.defaultMode });
      }
      if (config.autoSend !== undefined) {
        updates.push({ key: 'fe_auto_send', value: config.autoSend.toString() });
      }
      if (config.printOnAccept !== undefined) {
        updates.push({ key: 'fe_print_on_accept', value: config.printOnAccept.toString() });
      }
      if (config.contingencyEnabled !== undefined) {
        updates.push({ key: 'fe_contingency_enabled', value: config.contingencyEnabled.toString() });
      }

      for (const update of updates) {
        const { error } = await this.supabase
          .from('system_config')
          .update({ value: update.value })
          .eq('key', update.key);

        if (error) throw error;
      }

      return { success: true };
    } catch (error: any) {
      console.error('[InvoiceService] Error updating config:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // INFORMACIÓN DEL NEGOCIO
  // =====================================================

  /**
   * Obtener información del negocio (emisor)
   */
  async getBusinessInfo(): Promise<BusinessInfo | null> {
    try {
      const { data, error } = await this.supabase
        .from('business_info')
        .select('*')
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          // No hay registro, retornar null
          return null;
        }
        throw error;
      }

      return this.mapToBusinessInfo(data as BusinessInfoRow);
    } catch (error) {
      console.error('[InvoiceService] Error getting business info:', error);
      return null;
    }
  }

  /**
   * Actualizar información del negocio
   */
  async updateBusinessInfo(info: Partial<BusinessInfo>): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: Record<string, unknown> = {};

      if (info.legalName !== undefined) updateData.legal_name = info.legalName;
      if (info.tradeName !== undefined) updateData.trade_name = info.tradeName;
      if (info.idType !== undefined) updateData.id_type = info.idType;
      if (info.idNumber !== undefined) updateData.id_number = info.idNumber;
      if (info.activityCode !== undefined) updateData.activity_code = info.activityCode;
      if (info.activityDescription !== undefined) updateData.activity_description = info.activityDescription;
      if (info.province !== undefined) updateData.province = info.province;
      if (info.canton !== undefined) updateData.canton = info.canton;
      if (info.district !== undefined) updateData.district = info.district;
      if (info.neighborhood !== undefined) updateData.neighborhood = info.neighborhood;
      if (info.otherAddress !== undefined) updateData.other_address = info.otherAddress;
      if (info.phone !== undefined) updateData.phone = info.phone;
      if (info.fax !== undefined) updateData.fax = info.fax;
      if (info.email !== undefined) updateData.email = info.email;
      if (info.feEnabled !== undefined) updateData.fe_enabled = info.feEnabled;
      if (info.feEnvironment !== undefined) updateData.fe_environment = info.feEnvironment;
      if (info.branchCode !== undefined) updateData.branch_code = info.branchCode;
      if (info.terminalCode !== undefined) updateData.terminal_code = info.terminalCode;

      updateData.updated_at = new Date().toISOString();

      const { error } = await this.supabase
        .from('business_info')
        .update(updateData)
        .eq('id', info.id);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('[InvoiceService] Error updating business info:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Verificar si la facturación electrónica está habilitada
   */
  async isElectronicInvoiceEnabled(): Promise<boolean> {
    const businessInfo = await this.getBusinessInfo();
    return businessInfo?.feEnabled ?? false;
  }

  // =====================================================
  // DOCUMENTOS ELECTRÓNICOS
  // =====================================================

  /**
   * Crear documento electrónico (factura o tiquete)
   */
  async createDocument(
    input: CreateElectronicDocumentInput
  ): Promise<{ success: boolean; document?: ElectronicDocument; error?: string }> {
    try {
      const businessInfo = await this.getBusinessInfo();
      if (!businessInfo) {
        return { success: false, error: 'No hay información del negocio configurada' };
      }

      // Obtener el consecutivo actual según el tipo de documento
      const consecutiveNumber = this.getNextConsecutive(businessInfo, input.documentType);

      // Generar consecutivo formateado (20 caracteres)
      const consecutive = generateConsecutive(
        businessInfo.branchCode,
        businessInfo.terminalCode,
        input.documentType,
        consecutiveNumber
      );

      // Generar clave numérica (50 dígitos)
      const emissionDate = input.emissionDate || new Date();
      const numericKey = generateNumericKey(
        emissionDate,
        businessInfo.idNumber,
        consecutive,
        input.documentType
      );

      // Crear registro del documento
      const documentData = {
        sale_id: input.saleId || null,
        numeric_key: numericKey,
        document_type: input.documentType,
        consecutive: consecutive,
        receptor_name: input.receptor?.name || null,
        receptor_id_type: input.receptor?.idType || null,
        receptor_id_number: input.receptor?.idNumber || null,
        receptor_email: input.receptor?.email || null,
        status: 'pending' as DocumentStatus,
        emission_date: emissionDate.toISOString(),
        invoice_mode: 'electronic' as InvoiceMode,
      };

      const { data, error } = await this.supabase
        .from('electronic_documents')
        .insert(documentData)
        .select()
        .single();

      if (error) throw error;

      console.log('[InvoiceService] ✅ Documento creado:', numericKey);

      return {
        success: true,
        document: this.mapToElectronicDocument(data as ElectronicDocumentRow),
      };
    } catch (error: any) {
      console.error('[InvoiceService] Error creating document:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Obtener documento por ID
   */
  async getDocument(documentId: string): Promise<ElectronicDocument | null> {
    try {
      const { data, error } = await this.supabase
        .from('electronic_documents')
        .select('*')
        .eq('id', documentId)
        .single();

      if (error) throw error;

      return this.mapToElectronicDocument(data as ElectronicDocumentRow);
    } catch (error) {
      console.error('[InvoiceService] Error getting document:', error);
      return null;
    }
  }

  /**
   * Obtener documento por venta
   */
  async getDocumentBySale(saleId: string): Promise<ElectronicDocument | null> {
    try {
      const { data, error } = await this.supabase
        .from('electronic_documents')
        .select('*')
        .eq('sale_id', saleId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') return null;
        throw error;
      }

      return this.mapToElectronicDocument(data as ElectronicDocumentRow);
    } catch (error) {
      console.error('[InvoiceService] Error getting document by sale:', error);
      return null;
    }
  }

  /**
   * Listar documentos con filtros
   */
  async listDocuments(options: {
    status?: DocumentStatus;
    documentType?: DocumentType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  } = {}): Promise<ElectronicDocument[]> {
    try {
      let query = this.supabase
        .from('electronic_documents')
        .select('*')
        .order('emission_date', { ascending: false });

      if (options.status) {
        query = query.eq('status', options.status);
      }
      if (options.documentType) {
        query = query.eq('document_type', options.documentType);
      }
      if (options.startDate) {
        query = query.gte('emission_date', options.startDate.toISOString());
      }
      if (options.endDate) {
        query = query.lte('emission_date', options.endDate.toISOString());
      }
      if (options.limit) {
        query = query.limit(options.limit);
      }

      const { data, error } = await query;

      if (error) throw error;

      return (data || []).map((row) => this.mapToElectronicDocument(row as ElectronicDocumentRow));
    } catch (error) {
      console.error('[InvoiceService] Error listing documents:', error);
      return [];
    }
  }

  /**
   * Actualizar estado del documento
   */
  async updateDocumentStatus(
    documentId: string,
    status: DocumentStatus,
    haciendaResponse?: {
      status?: string;
      message?: string;
      detail?: string;
      xmlResponse?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updateData: Record<string, unknown> = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (status === 'sent') {
        updateData.sent_date = new Date().toISOString();
      }

      if (haciendaResponse) {
        updateData.response_date = new Date().toISOString();
        if (haciendaResponse.status) updateData.hacienda_status = haciendaResponse.status;
        if (haciendaResponse.message) updateData.hacienda_message = haciendaResponse.message;
        if (haciendaResponse.detail) updateData.hacienda_detail = haciendaResponse.detail;
        if (haciendaResponse.xmlResponse) updateData.xml_response = haciendaResponse.xmlResponse;
      }

      const { error } = await this.supabase
        .from('electronic_documents')
        .update(updateData)
        .eq('id', documentId);

      if (error) throw error;

      return { success: true };
    } catch (error: any) {
      console.error('[InvoiceService] Error updating document status:', error);
      return { success: false, error: error.message };
    }
  }

  // =====================================================
  // HELPERS PRIVADOS
  // =====================================================

  private getNextConsecutive(businessInfo: BusinessInfo, documentType: DocumentType): number {
    switch (documentType) {
      case DOCUMENT_TYPES.FACTURA:
        return businessInfo.consecutiveFactura;
      case DOCUMENT_TYPES.TIQUETE:
        return businessInfo.consecutiveTiquete;
      case DOCUMENT_TYPES.NOTA_CREDITO:
        return businessInfo.consecutiveNc;
      case DOCUMENT_TYPES.NOTA_DEBITO:
        return businessInfo.consecutiveNd;
      default:
        return 1;
    }
  }

  private mapToBusinessInfo(row: BusinessInfoRow): BusinessInfo {
    return {
      id: row.id,
      legalName: row.legal_name,
      tradeName: row.trade_name,
      idType: row.id_type as BusinessInfo['idType'],
      idNumber: row.id_number,
      activityCode: row.activity_code,
      activityDescription: row.activity_description,
      province: row.province,
      canton: row.canton,
      district: row.district,
      neighborhood: row.neighborhood,
      otherAddress: row.other_address,
      phone: row.phone,
      fax: row.fax,
      email: row.email,
      feEnabled: row.fe_enabled,
      feEnvironment: row.fe_environment as 'stag' | 'prod',
      feAtvUser: row.fe_atv_user,
      consecutiveFactura: row.consecutive_factura,
      consecutiveTiquete: row.consecutive_tiquete,
      consecutiveNc: row.consecutive_nc,
      consecutiveNd: row.consecutive_nd,
      branchCode: row.branch_code,
      terminalCode: row.terminal_code,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }

  private mapToElectronicDocument(row: ElectronicDocumentRow): ElectronicDocument {
    return {
      id: row.id,
      saleId: row.sale_id,
      numericKey: row.numeric_key,
      documentType: row.document_type as DocumentType,
      consecutive: row.consecutive,
      receptorName: row.receptor_name,
      receptorIdType: row.receptor_id_type as ElectronicDocument['receptorIdType'],
      receptorIdNumber: row.receptor_id_number,
      receptorEmail: row.receptor_email,
      status: row.status as DocumentStatus,
      xmlContent: row.xml_content,
      xmlResponse: row.xml_response,
      haciendaStatus: row.hacienda_status,
      haciendaMessage: row.hacienda_message,
      haciendaDetail: row.hacienda_detail,
      emissionDate: row.emission_date,
      sentDate: row.sent_date,
      responseDate: row.response_date,
      invoiceMode: row.invoice_mode as InvoiceMode,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    };
  }
}

export const invoiceService = new InvoiceService();
