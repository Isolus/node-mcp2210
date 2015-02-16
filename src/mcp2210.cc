#include <node.h>
#include <v8.h>
#include "mcp2210_obj.h"

using namespace v8;

void Init(Handle<Object> exports, Handle<Object> module) 
{
	MCP2210::Init(exports);
}

NODE_MODULE(MCP2210, Init)