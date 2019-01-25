#include <any>
#include <iostream>
#include <optional>
#include <variant>

#include <websocketpp/config/asio_no_tls.hpp>
#include <websocketpp/server.hpp>

#include "test.pb.h"

typedef websocketpp::server<websocketpp::config::asio> server;

using websocketpp::lib::placeholders::_1;
using websocketpp::lib::placeholders::_2;
using websocketpp::lib::bind;

// pull out the type of messages sent by our config
typedef server::message_ptr message_ptr;

template<typename T> std::optional<ggj::ServerMessage> processMessage(const T& message);

using EntityId = uint64_t;

struct BaseEntity {
    EntityId id;
    float x, y;

    static EntityId entityCounter;
};
EntityId BaseEntity::entityCounter = 0;

struct PlayerEntity : public BaseEntity {
};

std::unordered_map<EntityId, std::variant<PlayerEntity>> world;

template<> std::optional<ggj::ServerMessage> processMessage<ggj::HelloMessage>(const ggj::HelloMessage& msg) {
    const auto newId = BaseEntity::entityCounter++;
    world[newId] = PlayerEntity{{newId, 0.f, 0.f}};

    ggj::ServerMessage response;
    auto* helloResponse = new ggj::HelloResponse();
    helloResponse->set_userid(newId);
    helloResponse->set_x(0.f);
    helloResponse->set_y(0.f);
    response.set_allocated_helloresponse(new ggj::HelloResponse);
    return response;
}

template<> std::optional<ggj::ServerMessage> processMessage<ggj::UpdateMessage>(const ggj::UpdateMessage& msg) {

    return std::nullopt;
}

// Define a callback to handle incoming messages
void on_message(server* s, websocketpp::connection_hdl hdl, message_ptr msg) {
    std::cout << "on_message called with hdl: " << hdl.lock().get()
              << " and message: " << msg->get_payload()
              << std::endl;

    const auto msg_str = msg->get_payload();
    ggj::ClientMessage clientMessage;
    clientMessage.ParseFromArray(msg_str.data(), msg_str.size());
    std::optional<ggj::ServerMessage> response;
    if(clientMessage.has_hellomessage()) {
        response = processMessage(clientMessage.hellomessage());
    } else if(clientMessage.has_updatemessage()) {
        response = processMessage(clientMessage.updatemessage());
    }

    if(response) {
        try {
            const auto response_str = response->SerializeAsString();
            s->send(hdl, response_str, msg->get_opcode());
        } catch (websocketpp::exception const & e) {
            std::cout << "Echo failed because: "
                    << "(" << e.what() << ")" << std::endl;
        }
    }
}

int main() {
    // Create a server endpoint
    server echo_server;

    try {
        // Set logging settings
        echo_server.set_access_channels(websocketpp::log::alevel::all);
        echo_server.clear_access_channels(websocketpp::log::alevel::frame_payload);

        // Initialize Asio
        echo_server.init_asio();

        // Register our message handler
        echo_server.set_message_handler(bind(&on_message,&echo_server,::_1,::_2));

        // Listen on port 9002
        echo_server.listen(9002);

        // Start the server accept loop
        echo_server.start_accept();

        // Start the ASIO io_service run loop
        echo_server.run();
    } catch (websocketpp::exception const & e) {
        std::cout << e.what() << std::endl;
    } catch (...) {
        std::cout << "other exception" << std::endl;
    }
}
