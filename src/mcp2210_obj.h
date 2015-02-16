#ifndef MCP2210_OBJ_H
#define MCP2210_OBJ_H

#include <node.h>
#include <node_object_wrap.h>
#include <hidapi.h>

typedef uint8_t byte;

#define MCP2210_VID 0x04d8
#define MCP2210_PID 0x00de

#define OPERATION_SUCCESSFUL 0
#define ERROR_UNABLE_TO_OPEN_DEVICE -1
#define ERROR_UNABLE_TO_WRITE_TO_DEVICE -2
#define ERROR_UNABLE_TO_READ_FROM_DEVICE -3
#define ERROR_INVALID_DEVICE_HANDLE -99

#define COMMAND_BUFFER_LENGTH 64
#define RESPONSE_BUFFER_LENGTH 64

class MCP2210 : public node::ObjectWrap
{
public:
	static void Init(v8::Handle<v8::Object> exports);
	static char *wchar_t_to_utf8(const wchar_t *);
	static wchar_t *utf8_to_wchar_t(const char *utf8);

private:
	explicit MCP2210();
	explicit MCP2210(char *serialNumber);
	explicit MCP2210(unsigned short vid, unsigned short pid, char *serialNumber);
	~MCP2210();

	v8::Handle<v8::Value> CreateObject();
	static void New(const v8::FunctionCallbackInfo<v8::Value>& args);
	static void ListDevices(const v8::FunctionCallbackInfo<v8::Value>& args);
	static void Close(const v8::FunctionCallbackInfo<v8::Value>& args);
	static v8::Persistent<v8::Function> constructor;

	static void SendUSBCmd(const v8::FunctionCallbackInfo<v8::Value>& args);

	hid_device *device_;
};

#endif
