# cmd/main.go

- Language: go
- Summary: Command server runs the sample HTTP service. 3 symbol(s): Server, Server.Start, main

## STRUCT Server  _(line 6)_

## METHOD Server.Start(addr string) -> error  _(line 11)_

> Start binds the port and serves.

1. If s.Port == 0
2. Return fmt.Errorf("no port")
3. Defer fmt.Println("stopped")
4. Return nil

## FUNCTION main()  _(line 19)_

1. Call s.Start
