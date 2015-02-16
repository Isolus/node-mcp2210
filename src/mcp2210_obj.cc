#include <node.h>
#include <unistd.h>
#include <stdlib.h>
#include <string.h>
#include <node_buffer.h>
#include "mcp2210_obj.h"

using namespace v8;

Persistent<Function> MCP2210::constructor;

MCP2210::MCP2210(unsigned short vid, unsigned short pid, char *serialNumber)
{
	Isolate* isolate = Isolate::GetCurrent();

	wchar_t *tmp = utf8_to_wchar_t(serialNumber);
	device_ = hid_open(vid, pid, tmp);
	free(tmp);

	if (!device_) {
		isolate->ThrowException(Exception::Error(String::NewFromUtf8(isolate, "Cannot open device.")));
	}
}
MCP2210::MCP2210(char *serialNumber)
{
	Isolate* isolate = Isolate::GetCurrent();

	wchar_t *tmp = utf8_to_wchar_t(serialNumber);
	device_ = hid_open(MCP2210_VID, MCP2210_PID, tmp);
	free(tmp);
	if (!device_) {
		isolate->ThrowException(Exception::Error(String::NewFromUtf8(isolate, "Cannot open device.")));
	}
}
MCP2210::MCP2210()
{
	Isolate* isolate = Isolate::GetCurrent();

	device_ = hid_open(MCP2210_VID, MCP2210_PID, NULL);
	if (!device_) {
		isolate->ThrowException(Exception::Error(String::NewFromUtf8(isolate, "Cannot open device.")));
	}
}

MCP2210::~MCP2210() 
{
	if (device_) {
		hid_close(device_);
	}
}

void MCP2210::Init(Handle<Object> exports)
{
	Isolate* isolate = Isolate::GetCurrent();

	// Prepare constructor template
	Local<FunctionTemplate> tpl = FunctionTemplate::New(isolate, New);
	tpl->SetClassName(String::NewFromUtf8(isolate, "MCP2210"));
	tpl->InstanceTemplate()->SetInternalFieldCount(1);

	NODE_SET_PROTOTYPE_METHOD(tpl, "close", Close);
	NODE_SET_PROTOTYPE_METHOD(tpl, "sendUSBCmd", SendUSBCmd);

	constructor.Reset(isolate, tpl->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "list"), FunctionTemplate::New(isolate, ListDevices)->GetFunction());
	exports->Set(String::NewFromUtf8(isolate, "MCP2210"), tpl->GetFunction());
}

void MCP2210::New(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	if (args.IsConstructCall()) {
		// Invoked as constructor: `new MyObject(...)`
		MCP2210* obj;
		if (args.Length() == 3) {
			if (!args[0]->IsNumber() || !args[1]->IsNumber() || !args[2]->IsString()) {
				isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong arguments")));
				args.GetReturnValue().SetUndefined();
	 			return;
			}
			obj = new MCP2210(args[0]->NumberValue(), args[1]->NumberValue(), *v8::String::Utf8Value(args[2]->ToString()));
		}
		else if (args.Length() == 1) {
			if (!args[0]->IsString()) {
				isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong arguments")));
				args.GetReturnValue().SetUndefined();
				return;
			}
			obj = new MCP2210(*v8::String::Utf8Value(args[0]->ToString()));
		}
		else if (args.Length() == 0) {
			obj = new MCP2210();
		}
		else {
			isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong number of arguments")));
    			args.GetReturnValue().SetUndefined();
			return;
		}
		obj->Wrap(args.This());
		args.GetReturnValue().Set(args.This());
	}
	else {
		// Invoked as plain function `MyObject(...)`, turn into construct call.
		int argc = args.Length();
		Local<Value> argv[3] = { args[0], args[1], args[2] };
		Local<Function> cons = Local<Function>::New(isolate, constructor);
		args.GetReturnValue().Set(cons->NewInstance(argc, argv));
	}
}

char *MCP2210::wchar_t_to_utf8(const wchar_t *wchar) 
{
	char *ret = NULL;

	if (wchar) {
		size_t ulen = wcstombs(NULL, wchar, 0);
		if (ulen == (size_t)-1) {
			return strdup("");
		}
		ret = (char *)calloc(ulen + 1, sizeof(char *));
		wcstombs(ret, wchar, ulen + 1);
		ret[ulen] = 0x0;
	}

	return ret;
}
wchar_t *MCP2210::utf8_to_wchar_t(const char *utf8)
{
	wchar_t *ret = NULL;

	if (utf8) {
		size_t wlen = mbstowcs(NULL, utf8, 0);
		if (wlen == (size_t)-1) {
			return wcsdup(L"");
		}
		ret = (wchar_t *)calloc(wlen+1, sizeof(wchar_t));
		mbstowcs(ret, utf8, wlen+1);
		ret[wlen] = 0x0000;
	}

	return ret;
}

void MCP2210::ListDevices(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	hid_device_info* devices = hid_enumerate(MCP2210_VID, MCP2210_PID);
	hid_device_info* currentDevice = devices;

	int dlen = 0;
	while (currentDevice) { dlen++; currentDevice = currentDevice->next; }
	currentDevice = devices;

	int cur = 0;
	char *tmp;
	Handle<Array> array = Array::New(isolate, dlen);
	while (currentDevice)
	{
		Local<Object> dev = Object::New(isolate);

		dev->Set(String::NewFromUtf8(isolate, "path"), String::NewFromUtf8(isolate, currentDevice->path));

		dev->Set(String::NewFromUtf8(isolate, "vendorId"), Integer::New(isolate, currentDevice->vendor_id));
		dev->Set(String::NewFromUtf8(isolate, "productId"),  Integer::New(isolate, currentDevice->product_id));

		tmp = wchar_t_to_utf8(currentDevice->serial_number);
		dev->Set(String::NewFromUtf8(isolate, "serialNumber"), String::NewFromUtf8(isolate, tmp));
		free(tmp);

		dev->Set(String::NewFromUtf8(isolate, "releaseNumber"),  Integer::New(isolate, currentDevice->release_number));

		tmp = wchar_t_to_utf8(currentDevice->manufacturer_string);
		dev->Set(String::NewFromUtf8(isolate, "manufacturerString"), String::NewFromUtf8(isolate, tmp));
		free(tmp);

		tmp = wchar_t_to_utf8(currentDevice->product_string);
		dev->Set(String::NewFromUtf8(isolate, "productString"), String::NewFromUtf8(isolate, tmp));
		free(tmp);

		dev->Set(String::NewFromUtf8(isolate, "usagePage"),  Integer::New(isolate, currentDevice->usage_page));
		dev->Set(String::NewFromUtf8(isolate, "usage"),  Integer::New(isolate, currentDevice->usage));
		dev->Set(String::NewFromUtf8(isolate, "interface_number"),  Integer::New(isolate, currentDevice->interface_number));

		array->Set(cur, dev);
		currentDevice = currentDevice->next;
		cur++;
	}
	hid_free_enumeration(devices);

	Local<Function> cb = Local<Function>::Cast(args[0]);
	const unsigned argc = 1;
	Local<Value> argv[argc] = { Local<Value>::New(isolate, array) };
	cb->Call(isolate->GetCurrentContext()->Global(), argc, argv);

	args.GetReturnValue().SetUndefined();
}

void MCP2210::Close(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);

	MCP2210* obj = ObjectWrap::Unwrap<MCP2210>(args.This());
	if (obj->device_) {
		hid_close(obj->device_);
	}
	args.GetReturnValue().SetUndefined();
}

void MCP2210::SendUSBCmd(const FunctionCallbackInfo<Value>& args)
{
	Isolate* isolate = Isolate::GetCurrent();
	HandleScope scope(isolate);
	int err = 0;

	MCP2210* obj = ObjectWrap::Unwrap<MCP2210>(args.This());

	if ((args.Length() != 2) || !node::Buffer::HasInstance(args[0]) || !args[1]->IsFunction()) {
		isolate->ThrowException(Exception::TypeError(String::NewFromUtf8(isolate, "Wrong arguments")));
		return;
	}

	byte cmd[COMMAND_BUFFER_LENGTH];
	byte rsp[RESPONSE_BUFFER_LENGTH];

	memcpy(cmd, node::Buffer::Data(args[0]->ToObject()), node::Buffer::Length(args[0]->ToObject()));

	int r;
	r = hid_write(obj->device_, cmd, COMMAND_BUFFER_LENGTH);
	if (r < 0) {
		err = ERROR_UNABLE_TO_WRITE_TO_DEVICE;
	}
	else {
		r = hid_read(obj->device_, rsp, RESPONSE_BUFFER_LENGTH);
		if (r < 0) {
			err = ERROR_UNABLE_TO_READ_FROM_DEVICE;
		}
		else {
			while (r == 0) {
				r = hid_read(obj->device_, rsp, RESPONSE_BUFFER_LENGTH);
				if (r < 0) {
					err = ERROR_UNABLE_TO_READ_FROM_DEVICE;
					break;
				}
				usleep(1000);
			}
		}
	}

	Local<Object> slowBuffer = node::Buffer::New(isolate, RESPONSE_BUFFER_LENGTH);
	memcpy(node::Buffer::Data(slowBuffer), rsp, RESPONSE_BUFFER_LENGTH);
	Local<Object> globalObj = isolate->GetCurrentContext()->Global();
	Local<Function> bufferConstructor =
	Local<Function>::Cast(globalObj->Get(String::NewFromUtf8(isolate, "Buffer")));
	Handle<Value> constructorArgs[3] = {
		slowBuffer,
		Integer::New(isolate, RESPONSE_BUFFER_LENGTH),
		Integer::New(isolate, 0)
	};
	Local<Object> responseBuffer = bufferConstructor->NewInstance(3, constructorArgs);

	Local<Function> cb = Local<Function>::Cast(args[1]);
	const unsigned argc = 2;
	Local<Value> argv[argc] = { Local<Value>::New(isolate, Boolean::New(isolate, err)), Local<Value>::New(isolate, responseBuffer) };
	cb->Call(isolate->GetCurrentContext()->Global(), argc, argv);

	args.GetReturnValue().SetUndefined();
}

