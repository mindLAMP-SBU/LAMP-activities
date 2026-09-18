const signsData = [
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550351401249669240/image.png?ex=6aae04c2&is=6aacb342&hm=d70ffff4277eca2aba3cc82d4635b29565cb497a9eb2d2ccdaf9048df804b4b8&",
        "description": "WINDING ROAD LEFT AHEAD (W1-5)",
        "category": "Warning"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550351724932235374/image.png?ex=6aae050f&is=6aacb38f&hm=fb427e32d1a461fae7262f58df6e91a1ea26777b489d16afc10e492949b2c1b0&",
        "description": "T INTERSECTION",
        "category": "Warning"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550355146066886666/image.png?ex=6aae083f&is=6aacb6bf&hm=2453ac03193a1b6beab30b2cf4365919bc282c8cd6af2d867caeeced312e21eb&",
        "description": "DEER CROSSING",
        "category": "Warning"
    },
    {
        "image": "https://media.discordapp.net/attachments/1550351197905494076/1550364701375074355/4.png?ex=6aae1125&is=6aacbfa5&hm=36350bb0bd3163d2eb9ccf1cc843c09ac52b723bdda543191e6484900aaa766d&=&format=webp&quality=lossless",
        "description": "ROAD NARROWS",
        "category": "Warning"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364701823868938/5.png?ex=6aae1125&is=6aacbfa5&hm=902193f488bb83c38b2dfacc19db4cea1a57f73c7032569cc53211cd5d02387b&",
        "description": "HILL",
        "category": "Warning"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364702289170442/6.png?ex=6aae1125&is=6aacbfa5&hm=274bdfea3960471d065565cd0826fa8ed42ece5655c73f26e0ed7c80cdde8ce8&",
        "description": "RAIL ROAD CROSSING AHEAD",
        "category": "Warning"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364702746480650/7.png?ex=6aae1125&is=6aacbfa5&hm=7e219c1206c30ae47c7b94922c6c42c1ca7be6298347de139961a27c4e7ffa48&",
        "description": "LIGHT RAIL VEHICLE APPROACHING",
        "category": "Warning"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364703006658630/8.png?ex=6aae1125&is=6aacbfa5&hm=fcc32a646ad0a0eea3e08af30611d9d67d5cc5d8bbab814faeb5bd9ab595c978&",
        "description": "WORKERS AHEAD",
        "category": "Temporary Traffic Control"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364703245467668/9.png?ex=6aae1125&is=6aacbfa5&hm=2ca1775d7eb3e3fb8a9d8aac50b4359c61394b4e4647fceb3d5fc81874e2d859&",
        "description": "HAZARDOUS MATERIALS PROHIBITED",
        "category": "Regulatory"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364703471964231/10.png?ex=6aae1125&is=6aacbfa5&hm=d5deda2c56a56a461a6335104d4009e82c268b3afa9bff11fbf35d3741d8743c&",
        "description": "HOV LANE AHEAD",
        "category": "Regulatory"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364750003699823/11.png?ex=6aae1130&is=6aacbfb0&hm=126e8c56df14a2c0ac256fd5527ac197df9f9b68bf289005b109ec2e81af49c3&",
        "description": "TOW AWAY ZONE FOR PARKING VIOLATIONS",
        "category": "Regulatory"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364750284587081/12.png?ex=6aae1130&is=6aacbfb0&hm=4a976b4936f4e1c276016d00541768bec830bacd88379a44d0340e7130687b76&",
        "description": "AUTO MECHANIC",
        "category": "Motorist Services and Recreation"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364750616207360/13.png?ex=6aae1130&is=6aacbfb0&hm=2853f2929b22a0ce9e55322b03cdf33f78fd687f0515ec8794b033164c01fb9d&",
        "description": "PICNIC AREA",
        "category": "Motorist Services and Recreation"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364750918062130/14.png?ex=6aae1131&is=6aacbfb1&hm=544b6af604afe62ca8306075638b632577b682a0ab694c87c3d7e1f90b947aff&",
        "description": "NO HITCHHIKING",
        "category": "Pedestrian and Bicycle Signs"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364751199076473/15.png?ex=6aae1131&is=6aacbfb1&hm=3afb03d79b40ed23209c7f6b5a9aaeac9de0b2548fbb4a11d390f3d37fc1108c&",
        "description": "PLAYGROUND AREA",
        "category":"Pedestrian and Bicycle Signs"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364751648006195/16.png?ex=6aae1131&is=6aacbfb1&hm=7ee735d917325b64d9358d00671596e767bdc3054ea0c8deb2fbbee926ec2641&",
        "description": "YIELD",
        "category": "Regulatory"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550369085366337566/17.png?ex=6aae153a&is=6aacc3ba&hm=bd49ea7e96fa540d67583ccd2e1c9d5b22978f23bdc5027019e9a05703e8b65c&",
        "description": "NO TRUCKS",
        "category": "Regulatory"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364751975026818/18.png?ex=6aae1131&is=6aacbfb1&hm=bdc5c0137fb5d411133cc8fe5ca0bd9c953062e2cc4cbd4a2ecffa0ca047fbd5&",
        "description": "NO LEFT TURN OR U TURN",
        "category": "Regulatory"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364752243593317/19.png?ex=6aae1131&is=6aacbfb1&hm=d6d2e2e37b346e0bf031579deede1946c038bd64e61135433767df205ee99887&",
        "description": "INTERSECTION LANE CONTROL",
        "category": "Regulatory"
    },
    {
        "image": "https://cdn.discordapp.com/attachments/1550351197905494076/1550364752553709601/20.png?ex=6aae1131&is=6aacbfb1&hm=6e926d79215328ae91e2f6869ea814ddaae50551e80edc02d69ac5bf4c4a89f9&",
        "description": "DIVIDED HIGHWAY",
        "category": "Regulatory"
    }
]

export default signsData