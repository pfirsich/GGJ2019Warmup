cmake_minimum_required(VERSION 3.10)
project(WarmupServer)
set(CMAKE_CXX_STANDARD 17)
find_package (Boost 1.65.0 COMPONENTS system thread random REQUIRED)
find_package(websocketpp REQUIRED)
find_package(Protobuf REQUIRED)
add_executable(WarmupServer server.cpp test.pb.cc)
target_link_libraries(WarmupServer Boost::system ${Protobuf_LIBRARIES})
