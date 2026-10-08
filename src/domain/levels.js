(function(root){
  'use strict';
  const levels = [
  {
    "id": "intro-cross",
    "version": 1,
    "status": "verified",
    "rules": "square4-open-v1",
    "title": "一粒沙的十字",
    "description": "中心已有 3 粒。再加一粒，会发生什么？",
    "board": {
      "width": 3,
      "height": 3,
      "initial": [
        0,
        0,
        0,
        0,
        3,
        0,
        0,
        0,
        0
      ],
      "target": [
        0,
        1,
        0,
        1,
        0,
        1,
        0,
        1,
        0
      ]
    },
    "allowedDropCells": [
      {
        "x": 1,
        "y": 1
      }
    ],
    "grainPerMove": 1,
    "maxMoves": 1,
    "referenceMoves": [
      {
        "x": 1,
        "y": 1
      }
    ]
  },
  {
    "id": "chain",
    "version": 1,
    "status": "verified",
    "rules": "square4-open-v1",
    "title": "连锁反应",
    "description": "中心崩塌会让上方的 3 粒也达到阈值。",
    "board": {
      "width": 3,
      "height": 3,
      "initial": [
        0,
        3,
        0,
        0,
        3,
        0,
        0,
        0,
        0
      ],
      "target": [
        1,
        0,
        1,
        1,
        1,
        1,
        0,
        1,
        0
      ]
    },
    "allowedDropCells": [
      {
        "x": 1,
        "y": 1
      }
    ],
    "grainPerMove": 1,
    "maxMoves": 1,
    "referenceMoves": [
      {
        "x": 1,
        "y": 1
      }
    ]
  },
  {
    "id": "corner",
    "version": 1,
    "status": "verified",
    "rules": "square4-open-v1",
    "title": "角落的沙",
    "description": "角格仍需 4 粒才崩塌，其中两粒会流出棋盘。",
    "board": {
      "width": 3,
      "height": 3,
      "initial": [
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "target": [
        0,
        1,
        0,
        1,
        0,
        0,
        0,
        0,
        0
      ]
    },
    "allowedDropCells": [
      {
        "x": 0,
        "y": 0
      }
    ],
    "grainPerMove": 1,
    "maxMoves": 1,
    "referenceMoves": [
      {
        "x": 0,
        "y": 0
      }
    ]
  },
  {
    "id": "edge",
    "version": 1,
    "status": "verified",
    "rules": "square4-open-v1",
    "title": "边缘传播",
    "description": "在边缘触发崩塌，观察一粒流失和三个内邻格。",
    "board": {
      "width": 3,
      "height": 3,
      "initial": [
        0,
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "target": [
        1,
        0,
        1,
        0,
        1,
        0,
        0,
        0,
        0
      ]
    },
    "allowedDropCells": [
      {
        "x": 1,
        "y": 0
      }
    ],
    "grainPerMove": 1,
    "maxMoves": 1,
    "referenceMoves": [
      {
        "x": 1,
        "y": 0
      }
    ]
  },
  {
    "id": "choose",
    "version": 1,
    "status": "verified",
    "rules": "square4-open-v1",
    "title": "选择落点",
    "description": "只有正确的落点组合才能得到十字；比较完整目标。",
    "board": {
      "width": 3,
      "height": 3,
      "initial": [
        0,
        0,
        0,
        0,
        2,
        0,
        0,
        0,
        0
      ],
      "target": [
        0,
        1,
        0,
        1,
        0,
        1,
        0,
        1,
        0
      ]
    },
    "allowedDropCells": [
      {
        "x": 1,
        "y": 1
      },
      {
        "x": 1,
        "y": 2
      },
      {
        "x": 2,
        "y": 1
      }
    ],
    "grainPerMove": 1,
    "maxMoves": 2,
    "referenceMoves": [
      {
        "x": 1,
        "y": 1
      },
      {
        "x": 1,
        "y": 1
      }
    ]
  },
  {
    "id": "combine",
    "version": 1,
    "status": "verified",
    "rules": "square4-open-v1",
    "title": "双源组合",
    "description": "两个沙源各有 3 粒。用两次投沙拼出对称图案。",
    "board": {
      "width": 5,
      "height": 5,
      "initial": [
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        3,
        1,
        3,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0,
        0
      ],
      "target": [
        0,
        0,
        0,
        0,
        0,
        0,
        1,
        0,
        1,
        0,
        1,
        0,
        3,
        0,
        1,
        0,
        1,
        0,
        1,
        0,
        0,
        0,
        0,
        0,
        0
      ]
    },
    "allowedDropCells": [
      {
        "x": 1,
        "y": 2
      },
      {
        "x": 3,
        "y": 2
      },
      {
        "x": 2,
        "y": 2
      }
    ],
    "grainPerMove": 1,
    "maxMoves": 2,
    "referenceMoves": [
      {
        "x": 1,
        "y": 2
      },
      {
        "x": 3,
        "y": 2
      }
    ]
  }
];
  if(typeof module === 'object' && module.exports) module.exports = levels;
  else root.SandpileLevels = levels;
})(globalThis);
