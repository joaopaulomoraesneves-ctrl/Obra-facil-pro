# Configuração Supabase — Obra Fácil Pro

## Estado atual

O Pacote 16 prepara o projeto para Supabase, mas ainda não conecta dados reais em nuvem.

A versão atual continua funcionando localmente com `localStorage`.

## Como iniciar ambiente moderno

1. Instale Node.js.
2. No terminal, dentro da pasta do projeto:

```bash
npm install
npm run dev
```

3. Abra o endereço exibido pelo Vite.

## Configurar variáveis

Copie:

```txt
.env.example
```

Para:

```txt
.env.local
```

E preencha:

```txt
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

## Próxima fase

No Pacote 17, o ideal é criar autenticação real e sincronização inicial de obras.
