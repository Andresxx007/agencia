FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/src/FortisSports.Api/FortisSports.Api.csproj backend/src/FortisSports.Api/
COPY backend/src/FortisSports.Application/FortisSports.Application.csproj backend/src/FortisSports.Application/
COPY backend/src/FortisSports.Domain/FortisSports.Domain.csproj backend/src/FortisSports.Domain/
COPY backend/src/FortisSports.Infrastructure/FortisSports.Infrastructure.csproj backend/src/FortisSports.Infrastructure/
RUN dotnet restore backend/src/FortisSports.Api/FortisSports.Api.csproj

COPY backend/ backend/
RUN dotnet publish backend/src/FortisSports.Api/FortisSports.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .
EXPOSE 8080
ENTRYPOINT ["dotnet", "FortisSports.Api.dll"]
