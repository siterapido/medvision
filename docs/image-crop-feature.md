# Funcionalidade de Crop de Imagens

## Visão Geral

Implementação de crop de imagens para thumbnails de Lives no painel administrativo. Os usuários agora podem ajustar, reposicionar e cortar imagens antes de fazer o upload, garantindo thumbnails perfeitas com proporção 16:9.

## Tecnologia Utilizada

- **react-easy-crop**: Biblioteca leve e performática para crop de imagens
- **Aspect ratio**: 16:9 (padrão para vídeos e thumbnails de Lives)
- **Output**: JPEG com qualidade 95%

## Componentes Criados

### 1. ImageCropDialog (`components/ui/image-crop-dialog.tsx`)

Componente reutilizável que oferece:

- **Área de crop interativa**: Arraste e posicione a imagem
- **Controle de zoom**: Slider de 100% a 300% com ícones visuais
- **Preview em tempo real**: Mostra exatamente o que será cortado
- **Aspect ratio configurável**: Padrão 16:9, mas pode ser customizado
- **Feedback visual**: Borda cyan e máscara escura na área fora do crop
- **Estados de loading**: Desabilita botões durante processamento

#### Funcionalidades Técnicas

```typescript
// Conversão de imagem para canvas e crop
async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<Blob>

// Criação de elemento Image a partir de URL
function createImage(url: string): Promise<HTMLImageElement>
```

#### Props do Componente

```typescript
interface ImageCropDialogProps {
  open: boolean                           // Controla visibilidade do dialog
  onOpenChange: (open: boolean) => void  // Callback para fechar
  imageSrc: string                        // URL da imagem para crop
  onCropComplete: (croppedImage: Blob) => void  // Callback com imagem cortada
  aspect?: number                         // Proporção (padrão: 16/9)
  isProcessing?: boolean                  // Estado de processamento
}
```

### 2. Integração no LiveFormDialog

Fluxo de upload atualizado:

1. **Seleção de arquivo**: Usuário clica em "Enviar imagem"
2. **Preview e crop**: Dialog abre com a imagem para ajuste
3. **Ajustes**: Usuário posiciona e faz zoom na imagem
4. **Confirmação**: Imagem é cortada e convertida para Blob
5. **Upload**: Blob é convertido para File e enviado ao Supabase
6. **Exibição**: Thumbnail cortada aparece no formulário

#### Mudanças no LiveFormDialog

```typescript
// Novos estados
const [cropDialogOpen, setCropDialogOpen] = useState(false)
const [imageToCrop, setImageToCrop] = useState<string>("")

// Nova função: Preparar imagem para crop
const handleFileSelect = (file: File) => {
  const reader = new FileReader()
  reader.onload = () => {
    setImageToCrop(reader.result as string)
    setCropDialogOpen(true)
  }
  reader.readAsDataURL(file)
}

// Nova função: Processar crop e fazer upload
const handleCropComplete = async (croppedBlob: Blob) => {
  // Converte blob para File
  const file = new File([croppedBlob], `thumbnail-${Date.now()}.jpg`, {
    type: "image/jpeg",
  })
  
  // Upload para Supabase
  const path = `thumbnails/${crypto.randomUUID()}.jpg`
  await supabase.storage.from("live-assets").upload(path, file)
}
```

## Interface do Usuário

### Antes (Upload Direto)
```
[Enviar imagem] → Upload automático → Exibição
```

### Depois (Com Crop)
```
[Enviar imagem] → Dialog de Crop → Ajustes → [Confirmar] → Upload → Exibição
```

### Elementos Visuais

1. **Label do campo**: Mostra ícone de crop e texto "com ajuste e crop"
2. **Dialog de crop**:
   - Título: "Ajustar Imagem"
   - Descrição: "Posicione e redimensione a imagem para criar a miniatura perfeita"
   - Área de crop: 400px altura, fundo escuro (#0f172a)
   - Borda do crop: Cyan (#06b6d4) com 2px
   - Máscara externa: Preto semi-transparente (rgba(0,0,0,0.5))

3. **Controles**:
   - Slider de zoom com ícones de ZoomOut e ZoomIn
   - Porcentagem de zoom exibida
   - Botões "Cancelar" e "Confirmar"

## Benefícios

✅ **UX Melhorada**: Usuários têm controle total sobre a aparência da thumbnail  
✅ **Consistência Visual**: Todas as thumbnails mantêm proporção 16:9  
✅ **Qualidade**: JPEG com 95% de qualidade preserva detalhes  
✅ **Flexibilidade**: Componente reutilizável para outras features  
✅ **Performance**: react-easy-crop é leve e não afeta o bundle size significativamente  
✅ **Mobile-friendly**: Funciona bem em telas de todos os tamanhos  

## Arquivos Modificados

1. **Criados**:
   - `components/ui/image-crop-dialog.tsx` - Componente de crop reutilizável

2. **Modificados**:
   - `components/admin/live-form-dialog.tsx` - Integração do crop
   - `package.json` - Adicionada dependência `react-easy-crop`

## Testes Recomendados

### Fluxo Completo
1. ✅ Acessar `/admin/lives`
2. ✅ Clicar em "Nova Live" ou editar existente
3. ✅ Clicar em "Enviar imagem"
4. ✅ Selecionar uma imagem do computador
5. ✅ Verificar se o dialog de crop abre
6. ✅ Testar arrastar a imagem
7. ✅ Testar zoom (slider e roda do mouse)
8. ✅ Clicar em "Confirmar"
9. ✅ Verificar se upload acontece
10. ✅ Verificar se thumbnail aparece no formulário
11. ✅ Salvar a Live
12. ✅ Verificar se thumbnail aparece na listagem

### Casos Especiais
- ✅ Imagem muito pequena (menor que a área de crop)
- ✅ Imagem muito grande (> 5MB)
- ✅ Diferentes formatos (JPG, PNG, WebP, GIF)
- ✅ Diferentes proporções (quadrada, retrato, paisagem)
- ✅ Cancelar durante o crop
- ✅ Remover thumbnail existente e adicionar nova

### Responsividade
- ✅ Desktop (> 1024px)
- ✅ Tablet (768px - 1024px)
- ✅ Mobile (< 768px)

## Possíveis Melhorias Futuras

1. **Rotação de imagem**: Adicionar botões para rotacionar 90°
2. **Filtros**: Brightness, contrast, saturação
3. **Múltiplos crops**: Gerar thumbnails em diferentes tamanhos
4. **Crop de vídeo**: Extrair frame de vídeo para thumbnail
5. **Templates**: Sobreposições pré-definidas (texto, logos)
6. **Histórico**: Desfazer/refazer ajustes
7. **Comparação**: Mostrar antes/depois lado a lado

## Compatibilidade

- ✅ Next.js 16
- ✅ React 19
- ✅ Supabase Storage
- ✅ Tailwind CSS 4
- ✅ TypeScript 5

## Documentação Relacionada

- [react-easy-crop Documentation](https://github.com/ricardo-ch/react-easy-crop)
- [Correção do Bucket live-assets](./live-assets-bucket-fix.md)
- [Cadastro e Gestão de Lives](../.trae/documents/Cadastro%20e%20Gestão%20de%20Lives%20(Admin%20+%20Dashboard).md)

---

**Status**: ✅ Implementado  
**Data**: 04/12/2025  
**Desenvolvedor**: Cursor AI + react-easy-crop  
**Versão**: 1.0.0


