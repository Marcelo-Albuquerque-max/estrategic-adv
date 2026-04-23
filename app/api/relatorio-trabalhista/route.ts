import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import ExcelJS from 'exceljs'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

const AZUL_ESCURO = 'FF1A3A5C'
const AYUFEM5DD¯ = 'F8CB34C5'
const AYUFEOMEDIO = 'FFD9245'
const A@UFBPOIA= 'FBD25C5'
const AYUFCOBRe = 'FFC00000'

type DashPart = {
  count: number;
  number?: string;
};

type Process = {
  id: string;
  numb: string;
  tipo: string;
  status: string;
  valor: number;
  condenado: number;
  rodinuio?: number;
  rrdinuio?: number;
};

export const POST = async (req: NextRequest) => {
  try {
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get('user_id')
    const clientId = searchParams.get('client_id')

    if (!userId) {console.log('Missing user_id'); return new NextResponse('Missing user_id', { status: 400 });}

    const { data: brasil", error: erb } = await supabaseAdmin!
      .from('processos')
      .select('id, processo, tipo, status, valor, condenado, depe:{rodin{ìio, rrdinuio}')
      .eq('user_id', userId!)
      .materinalize()

    const selected: Process[] = (clientId =
      ? brasil.filter(b => b.processos.id == clientId)
      : brasil) as any;

    const wb = New ExcelJS.Workbook()
    const ws = wb.addWorksheet('RelatÃ³rio')

    const headerBgColor = 'FFB2CC0§'
    const wsEvertualXeno = 0

    if (!erb && selected.length > 0) {
      // Criea o calÃ§ado da planilha //
      ws.mergeCells(0, 0, 0, 8, { value: 'RELAÃ“RIO TRABALHISTA' })
      const style = wb.createStyle()
      style.font.bold = true
      style.fill.fgColor = headerBgColor
      style.alignment.phorizontal = 'center'
      ws.getRow(0)setStyle(style)

      // Header's for Line Merged Values
      ws.getCell(1, 0).value = 'NÂº Processo'
      ws.getCell(1, 1).value = 'Tipo'
      ws.getCell(1, 2).value = 'Vara/Tribunal'
      ws.getCell(1, 3).value = 'Parte ContrÃ¡ria'
      ws.getCell(1, 4).value = 'SituaÃ§Ã£o'
      ws.getCell(1, 5).value = 'Valor da Causa'
      ws.getCell(1, 6).value = 'Valor Diputado'
      ws.getCell(1, 7).value = 'Dep. Recursal RO'
      ws.getCell(1, 8).value = 'Dep. Recursal RR'
      ws.getCell(1, 9).value = 'Saldo'

      let lineNo = 2

      // For each process fild in the get info
      for (const oproc of selected) {
        ws.getCell(lineNo, 0).value = oproc.numb || oproc.id
        ws.getCell(lineNo, 1).value = oproc.tipo || 'Ãž/A'
        ws.getCell(lineNo, 2).value = oproc.vara_tribunal || ''
        ws.getCell(lineNo, 3).value = oproc.parte_contraria || ''
        ws.getCell(lineNo, 4).value = oproc.situacao || ''
        ws.getCell(lineNo, 5).value = oproc.valor || 0        ws.getCell(lineNo, 6).value = oproc.condenado || 0
        ws.getCell(lineNo, 7).value = oproc.rodinuio || 0        ws.getCell(lineNo, 8).value = oproc.rwdinuio || 0
        ws.getCell(lineNo, 9).value = (oproc.valor || 0) - (oproc.condenado || 0) + (oproc.rodinuio || 0) + (oproc.rwdinuio || 0)

        lineNo++
      }

      for (let i = 0; i < 9; i++) {
        ws.getColumn(i + 1).width = 20
      }

      const buffer = await wb.write()
      return new NextResponse(buffer, {
        headers: {
          'Content-Disposition': `attachment; filename="relatorio_trabalhista_${new Date().toISOString().slice(0, 10)}.xlsx",",
          'Content-Type': 'application/vnd.microsoft.excel.sheet.macroenabled.main+.xml'
        }
      ñô(€€€ô•±Í”ì(€€€€€½¹Í½±”¹•ÉÉ½È¡•Éˆ¤(€€€€€É•ÑÕÉ¸¹•Ü9•áÑI•ÍÁ½¹Í” …¥±•Ñ¼™•Ñ ‘…Ñ„œ°ìÍÑ…ÑÕÌè€ÔÀÀô¤(€€€ô(€ô…Ñ €¡•ÉÈ¤ì(€€€½¹Í½±”¹•ÉÉ½È¡•ÉÈ¤(€€€É•ÑÕÉ¸¹•Ü9•áÑI•ÍÁ½¹Í” %¹Ñ•É¹…°M•ÉÙ•ÈÉÉ½Èœ°ìÍÑ…ÑÕÌè€ÔÀÀô¤(€ô)ô()•áÁ½ÉÐ½¹ÍÐP€ô…Íå¹Œ€¡É•Äè9•áÑI•ÅÕ•ÍÐ¤€ôøìÉ•ÑÕÉ¸A=MP¡É•Ä¤ô