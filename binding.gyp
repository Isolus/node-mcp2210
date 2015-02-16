{
  "variables": {
    "module_name":"<!(node -e \"console.log(require('./package.json').binary.module_name)\")",
    "module_path":"<!(node -e \"console.log(require('./package.json').binary.module_path)\")",
  },
  "targets": [
    {
      "target_name": "MCP2210",
      "sources": [ "src/mcp2210.cc", "src/mcp2210_obj.cc" ],
      "libraries": [ "/usr/lib/libhidapi-libusb.so" ], #[ "-lhidapi" ],
      "include_dirs": [
        "include", "/usr/include/hidapi/"
      ],
    },
    {
      "target_name": "action_after_build",
      "type": "none",
      "dependencies": [ "<(module_name)" ],
      "copies": [
        {
          "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
          "destination": "<(module_path)"
        }
      ]
    }
  ]
}
