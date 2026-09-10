# Design System — AcadIA

**Versão:** 0.1  
**Referência visual:** capturas disponíveis em `D:\Projetos DEV\Prints`  
**Escopo:** plataforma acadêmica do IFPB Campus João Pessoa

## 1. Direção visual

O AcadIA adotará uma identidade **acadêmica, tecnológica e acolhedora**, inspirada nos seguintes padrões observados nas referências:

- verde vivo como elemento de identidade;
- azul-petróleo em textos, botões e estados selecionados;
- fundo marfim levemente esverdeado;
- superfícies brancas com bordas e sombras suaves;
- navegação lateral destacada;
- cards grandes, simples e arredondados;
- ícones lineares;
- indicadores e etiquetas compactas;
- bastante espaço entre blocos de informação.

As referências serão usadas como direção, não como reprodução. Componentes, textos e fluxos serão adaptados à rotina dos estudantes e aos requisitos de acessibilidade.

## 2. Princípios

### Clareza antes da densidade

O painel deve mostrar primeiro o que exige atenção: prazos, frequência, atividades e próximos eventos. Informações complementares ficam em telas de detalhes.

### Orientar sem punir

Notas baixas e problemas de frequência devem ser apresentados com contexto e uma ação recomendada, sem rótulos negativos.

### Explicar a IA

Toda recomendação da AcadIA deve informar quais dados foram considerados e permitir que o estudante a ignore ou avalie.

### Consistência

Botões, cards, alertas, campos, ícones e espaçamentos devem manter o mesmo comportamento em todas as telas.

### Acessibilidade como padrão

Cor, movimento ou ícone nunca serão o único meio de transmitir uma informação.

## 3. Cores

### Identidade principal

| Token | Cor | Uso |
|---|---:|---|
| `brand-500` | `#31B85A` | Marca, ilustrações e áreas amplas |
| `brand-600` | `#16833F` | Botão primário e elementos com texto branco |
| `brand-700` | `#126B35` | Estado pressionado e contraste reforçado |
| `brand-100` | `#DCFCE7` | Fundo de destaque positivo |
| `brand-50` | `#F0FDF4` | Superfície suave |

O verde vivo das referências será mantido em áreas de marca. Para botões com texto branco será usado um verde mais escuro, garantindo melhor legibilidade.

### Azul-petróleo

| Token | Cor | Uso |
|---|---:|---|
| `teal-900` | `#073B4C` | Texto principal e botões escuros |
| `teal-800` | `#0B4F5C` | Item selecionado da navegação |
| `teal-700` | `#126271` | Links e gráficos |
| `teal-100` | `#DDF3F4` | Fundos informativos |

### Neutros

| Token | Cor | Uso |
|---|---:|---|
| `canvas` | `#F7F8EF` | Fundo principal |
| `surface` | `#FFFFFF` | Cards e modais |
| `surface-muted` | `#F8FAFC` | Blocos secundários |
| `text-primary` | `#0F2933` | Títulos e conteúdo principal |
| `text-secondary` | `#52616B` | Descrições e metadados |
| `text-muted` | `#74838C` | Legendas |
| `border` | `#DCE4E4` | Bordas padrão |
| `border-strong` | `#B8C5C7` | Campos ativos ou divisões fortes |

### Cores semânticas

| Estado | Cor principal | Fundo suave |
|---|---:|---:|
| Sucesso | `#16833F` | `#DCFCE7` |
| Informação | `#2563EB` | `#DBEAFE` |
| Atenção | `#A15C00` | `#FEF3C7` |
| Urgente | `#B42318` | `#FEE4E2` |
| IA | `#0F766E` | `#CCFBF1` |

A identidade da IA usará verde-azulado. Assim, permanece integrada à paleta das referências sem ser confundida com sucesso ou conclusão.

## 4. Tipografia

### Família

- **Interface e conteúdo:** `Inter`, com fallback para `Segoe UI`, `Roboto` e `sans-serif`.
- **Dados numéricos:** usar numerais tabulares quando disponíveis.

### Escala

| Estilo | Tamanho | Altura de linha | Peso |
|---|---:|---:|---:|
| Display | 36 px | 44 px | 700 |
| Título de página | 30 px | 38 px | 700 |
| Título de seção | 24 px | 32 px | 700 |
| Título de card | 18 px | 26 px | 600 |
| Corpo | 16 px | 24 px | 400 |
| Corpo forte | 16 px | 24 px | 600 |
| Auxiliar | 14 px | 20 px | 400 |
| Legenda | 12 px | 18 px | 500 |
| Indicador | 36 px | 40 px | 700 |

Não usar texto menor que 12 px. Conteúdo essencial deve permanecer em 14 px ou mais.

## 5. Espaçamento e dimensões

O sistema usa uma grade base de **4 px**.

| Token | Valor |
|---|---:|
| `space-1` | 4 px |
| `space-2` | 8 px |
| `space-3` | 12 px |
| `space-4` | 16 px |
| `space-5` | 20 px |
| `space-6` | 24 px |
| `space-8` | 32 px |
| `space-10` | 40 px |
| `space-12` | 48 px |

Dimensões principais:

- barra lateral desktop: `240 px`;
- cabeçalho: `72 px`;
- conteúdo: largura máxima de `1440 px`;
- botão e campo: mínimo de `44 px` de altura;
- área clicável de ícone: mínimo de `44 × 44 px`;
- distância padrão entre cards: `24 px`.

## 6. Bordas, raios e sombras

| Token | Valor | Uso |
|---|---:|---|
| `radius-sm` | 8 px | Chips e controles pequenos |
| `radius-md` | 12 px | Botões e campos |
| `radius-lg` | 16 px | Cards |
| `radius-xl` | 24 px | Painéis e modais especiais |
| `radius-pill` | 999 px | Status e avatar |

Sombras:

- `shadow-sm`: `0 1px 2px rgba(7, 59, 76, 0.06)`;
- `shadow-md`: `0 6px 18px rgba(7, 59, 76, 0.08)`;
- `shadow-focus`: `0 0 0 3px rgba(49, 184, 90, 0.28)`.

Cards comuns usam borda discreta e `shadow-sm`. Sombras maiores ficam reservadas a menus flutuantes e modais.

## 7. Estrutura de navegação

### Desktop

A navegação lateral segue o padrão das referências:

- marca AcadIA no topo;
- fundo `brand-500`;
- ícone e texto em cada item;
- item selecionado com fundo `teal-800`;
- perfil e configurações na parte inferior;
- área de conteúdo com cantos superiores arredondados quando adjacente à barra.

Itens:

1. Início;
2. Desempenho;
3. Disciplinas;
4. Agenda;
5. Oportunidades;
6. Editais;
7. Atendimento.

### Mobile

- Barra inferior com quatro destinos principais: Início, Disciplinas, Agenda e Menu.
- Demais áreas ficam dentro de “Menu”.
- Perfil e notificações permanecem no cabeçalho.
- A navegação não deve ocupar mais de 80 px de altura.

## 8. Componentes

### Botões

#### Primário

- Fundo `brand-600`;
- texto branco;
- altura mínima de 44 px;
- raio de 12 px;
- usado uma vez por seção sempre que possível.

#### Secundário

- Fundo branco;
- borda `brand-600`;
- texto `brand-700`.

#### Escuro

- Fundo `teal-900`;
- texto branco;
- usado para abrir detalhes, seguindo as referências.

#### Destrutivo

- Fundo `#B42318`;
- texto branco;
- reservado a exclusão, desconexão ou revogação.

### Campos

- Rótulo sempre visível acima do campo;
- placeholder apenas como exemplo;
- altura mínima de 48 px;
- ícone opcional à esquerda;
- mensagem de erro abaixo do campo;
- foco com borda verde e `shadow-focus`;
- nunca depender somente do placeholder para explicar o dado esperado.

### Cards de indicadores

Adaptação dos cards numéricos observados nas referências:

- valor principal grande;
- título curto;
- ícone linear em fundo verde suave;
- comparação com o período anterior;
- link para detalhes;
- quatro cards por linha no desktop, dois no tablet e um no celular.

Indicadores iniciais:

- média geral;
- frequência;
- atividades pendentes;
- próximo compromisso.

### Cards de disciplina

Inspirados nos cards de tickets das referências:

- nome da disciplina;
- professor;
- média e frequência;
- chips de status;
- quantidade de pendências;
- próxima atividade;
- botão “Ver disciplina”.

### Chips e status

- Altura entre 24 e 28 px;
- formato arredondado;
- texto curto;
- ícone quando necessário;
- cor acompanhada por texto.

Exemplos: `Em dia`, `Atenção`, `Atividade pendente`, `Inscrições abertas` e `Encerrado`.

### Cards da IA

- Barra ou ícone em `ai`;
- fundo `#F0FDFA`;
- título “Sugestão da AcadIA”;
- justificativa curta;
- ação principal;
- ações “Agora não” e “Isso foi útil?”.

### Alertas

Todo alerta contém:

- ícone;
- título;
- descrição;
- ação, quando aplicável;
- botão para dispensar, se não for obrigatório.

### Acordeões

O padrão da tela de detalhes das referências será aplicado a:

- informações da disciplina;
- detalhes de editais;
- documentos necessários;
- critérios de participação;
- dados dos setores de atendimento.

### Tabelas

- Cabeçalho fixo em listas longas;
- linhas com altura mínima de 52 px;
- opção de ordenar e filtrar;
- versão mobile convertida em cards;
- estado vazio com orientação clara.

### Gráficos

- Linha para evolução das notas;
- barras para frequência por disciplina;
- rosca somente para distribuições simples;
- rótulos e valores sempre disponíveis;
- descrição textual equivalente;
- no máximo seis cores simultâneas.

## 9. Painel principal

```text
┌──────────────┬──────────────────────────────────────────────┐
│              │ Busca             Notificações       Perfil │
│              ├──────────────────────────────────────────────┤
│   AcadIA     │ Olá! Veja como está sua semana.             │
│              │                                              │
│   Início     │ [Média] [Frequência] [Pendências] [Evento]  │
│   Desempenho │                                              │
│   Disciplinas│ [Disciplinas que merecem atenção]           │
│   Agenda     │                                              │
│   Estágios   │ [Evolução das notas] [Agenda da semana]      │
│   Editais    │                                              │
│   Atendimento│ [Sugestão da AcadIA]                         │
└──────────────┴──────────────────────────────────────────────┘
```

## 10. Tela de login

A composição dividida das referências será adaptada:

- lado esquerdo com imagem ou ilustração acadêmica sob filtro verde;
- lado direito com marca, mensagem de boas-vindas e autenticação;
- botão principal “Entrar com e-mail acadêmico”;
- indicação de projeto independente;
- links para privacidade, termos e ajuda;
- no celular, a imagem vira uma faixa reduzida ou é removida.

A plataforma não terá campos para senha do SUAP ou do Google.

## 11. Linguagem e conteúdo

### Tom

- Direto;
- acolhedor;
- respeitoso;
- sem termos excessivamente técnicos;
- sem infantilizar o estudante.

### Exemplos

Evitar:

> Seu desempenho está ruim.

Preferir:

> Sua média em Matemática está abaixo da meta definida. Há dois materiais que podem ajudar na revisão.

Evitar:

> Você não pode participar.

Preferir:

> Um dos requisitos pode não corresponder ao seu perfil. Confira o item 3.2 do edital oficial.

## 12. Movimento

- Transições entre 150 e 250 ms;
- animações somente para indicar mudança de estado ou hierarquia;
- evitar animações contínuas;
- respeitar `prefers-reduced-motion`;
- carregamentos usam skeleton discreto, sem saltos de layout.

## 13. Tema escuro

O tema escuro será preparado depois da interface clara estar validada. Tokens previstos:

- fundo: `#071A21`;
- superfície: `#0D2730`;
- superfície elevada: `#12333D`;
- texto principal: `#F1F5F5`;
- texto secundário: `#B8C5C7`;
- borda: `#294650`;
- verde de destaque: `#48C96E`.

## 14. Acessibilidade

- Seguir WCAG 2.2 nível AA como meta mínima.
- Contraste mínimo de 4,5:1 em textos comuns.
- Foco de teclado sempre visível.
- Ordem de tabulação coerente.
- Alvos interativos de pelo menos 44 × 44 px.
- Ícones decorativos ocultos de leitores de tela.
- Gráficos acompanhados por resumo textual ou tabela.
- Mensagens de erro associadas aos respectivos campos.
- Não usar somente verde e vermelho para diferenciar situações.

## 15. Tokens iniciais em CSS

```css
:root {
  --color-brand-500: #31b85a;
  --color-brand-600: #16833f;
  --color-brand-700: #126b35;
  --color-brand-100: #dcfce7;
  --color-brand-50: #f0fdf4;

  --color-teal-900: #073b4c;
  --color-teal-800: #0b4f5c;
  --color-teal-700: #126271;
  --color-teal-100: #ddf3f4;

  --color-canvas: #f7f8ef;
  --color-surface: #ffffff;
  --color-surface-muted: #f8fafc;
  --color-text-primary: #0f2933;
  --color-text-secondary: #52616b;
  --color-text-muted: #74838c;
  --color-border: #dce4e4;
  --color-border-strong: #b8c5c7;

  --color-success: #16833f;
  --color-info: #2563eb;
  --color-warning: #a15c00;
  --color-danger: #b42318;
  --color-ai: #0f766e;

  --radius-sm: 8px;
  --radius-md: 12px;
  --radius-lg: 16px;
  --radius-xl: 24px;
  --radius-pill: 999px;

  --shadow-sm: 0 1px 2px rgb(7 59 76 / 6%);
  --shadow-md: 0 6px 18px rgb(7 59 76 / 8%);
  --shadow-focus: 0 0 0 3px rgb(49 184 90 / 28%);
}
```

## 16. Decisões registradas

- O design será baseado na composição verde, marfim e azul-petróleo das referências.
- A navegação lateral será o padrão principal no desktop.
- Cards e seções expansíveis organizarão informações acadêmicas.
- O verde vivo será usado como marca, mas não em situações que reduzam o contraste.
- A AcadIA terá uma variação verde-azulada própria.
- A interface clara será priorizada no MVP; o tema escuro virá depois da validação.
- A identidade será original e não reproduzirá logotipo, textos ou imagens das referências.

