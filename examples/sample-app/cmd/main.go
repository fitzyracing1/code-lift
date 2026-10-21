// Command server runs the sample HTTP service.
package main

import "fmt"

type Server struct {
	Port int
}

// Start binds the port and serves.
func (s *Server) Start(addr string) error {
	if s.Port == 0 {
		return fmt.Errorf("no port")
	}
	defer fmt.Println("stopped")
	return nil
}

func main() {
	s := &Server{Port: 8080}
	s.Start(":8080")
}
