# Validação Pré-Backend

## Objetivo

Evitar levar dados quebrados para o Supabase.

## Validações principais

- Toda obra precisa ter ID.
- Toda obra precisa ter schema version.
- Cômodos devem ter ID e medidas numéricas.
- Compras devem ter estrutura consistente.
- Execução deve ter estágios e diário em arrays/objetos válidos.
- Planta não deve ter sobreposição grave.
- Backup geral deve ser recomendado antes da migração.

## Camada AppState

A interface deve evoluir para conversar com `AppState`, não diretamente com Supabase.

Fluxo recomendado:

```txt
UI → AppState → Storage local ou Supabase
```
