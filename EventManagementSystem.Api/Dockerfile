FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# copy csproj and restore as distinct layers
COPY *.sln ./
COPY EventManagementSystem.Api/*.csproj EventManagementSystem.Api/
RUN dotnet restore

# copy everything else and build
COPY . ./
WORKDIR /src/EventManagementSystem.Api
RUN dotnet publish -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish ./

ENV ASPNETCORE_URLS="http://+:5000;https://+:5001"
EXPOSE 5000 5001

ENTRYPOINT ["dotnet", "EventManagementSystem.Api.dll"]
