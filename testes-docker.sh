#!/bin/bash
echo "Iniciando testes no Docker (Backend)..."
docker compose run --rm backend npm test --workspace=pitang-backend -- --runInBand
echo ""
echo "Iniciando testes no Docker (Frontend)..."
docker compose run --rm backend npm test --workspace=pitang-frontend -- --runInBand
echo ""
echo "Todos os testes foram concluidos!"
