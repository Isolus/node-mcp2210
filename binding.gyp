{
  "variables": {
    "module_name":"<!(node -e \"console.log(require('./package.json').binary.module_name)\")",
    "module_path":"<!(node -e \"console.log(require('./package.json').binary.module_path)\")",
  },
  "targets": [
    {
      "target_name": "MCP2210",
      "sources": [ "src/mcp2210.cc", "src/mcp2210_obj.cc" ],
      "conditions": [
        ['OS=="mac"', {
          "libraries": [ "-lhidapi" ],
        }],
        ['OS=="linux"', {
          "libraries": [ "-hidapi-libusb" ],
        }],
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
