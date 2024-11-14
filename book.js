

// Import Three.js from CDN
const script = document.createElement('script');
script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
document.head.appendChild(script);

script.onload = () => {
    console.log("Three.js loaded");
    
    // Load OrbitControls first
    const controlsScript = document.createElement('script');
    controlsScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/controls/OrbitControls.js';
    document.head.appendChild(controlsScript);
    
    controlsScript.onload = () => {
        console.log("Controls loaded");
        
        // Then load RectAreaLight
        const rectAreaLightScript = document.createElement('script');
        rectAreaLightScript.src = 'https://cdn.jsdelivr.net/npm/three@0.128.0/examples/js/lights/RectAreaLightUniformsLib.js';
        document.head.appendChild(rectAreaLightScript);
        
        rectAreaLightScript.onload = () => {
            console.log("RectAreaLight loaded");
            init();
        };
    };
};

function init() {
    // Scene setup
    // THREE.ColorManagement.legacyMode = false;
    const scene = new THREE.Scene();

     scene.background = new THREE.Color(0x444444);  
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor( 0x000000, 0 );
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.4;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    document.getElementById('container').appendChild(renderer.domElement);
    
   // High-quality but subtle ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.1);  // Reduced intensity
    scene.add(ambientLight);

    // Main light - warm, strong keylight
    const mainLight = new THREE.PointLight(0xffd5b8, 0.2);  // Slightly warm color
    mainLight.position.set(3, 2, 4);
    camera.add(mainLight);

    // Fill light - cooler, softer light for contrast
    const fillLight = new THREE.PointLight(0xbce7fd, 0.5);  // Slightly cool color
    fillLight.position.set(-2, 0, 2);
    camera.add(fillLight);

        // Update lighting
    const spotLight = new THREE.SpotLight(0xffffff, 1);
    spotLight.position.set(0, 15, 0);
    spotLight.angle = 0.3;
    spotLight.penumbra = 1;
    spotLight.castShadow = true;
    spotLight.shadow.bias = -0.0001;
    camera.add(spotLight);

    // Rim light - helps separate book from background
    const rimLight = new THREE.PointLight(0xffffff, 0.6);
    rimLight.position.set(0, 3, -3);
    camera.add(rimLight);

    // Important: add camera to scene
    scene.add(camera);
    

// Optional: visualize light

    // Controls setup
    const controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    // Add these lines to control the orbit:
    controls.target.set(0, 0, 0);
    controls.update();


    // Book dimensions
    const width = 3;
    const height = 4;
    const depth = 0.5;
    const cornerRadius = 0.15;

    function createRoundedRectShape(width, height, radius) {
        const shape = new THREE.Shape();
        
        shape.moveTo(-width/2, -height/2);
        shape.lineTo(width/2 - radius, -height/2);
        shape.quadraticCurveTo(width/2, -height/2, width/2, -height/2 + radius);
        shape.lineTo(width/2, height/2 - radius);
        shape.quadraticCurveTo(width/2, height/2, width/2 - radius, height/2);
        shape.lineTo(-width/2, height/2);
        shape.lineTo(-width/2, -height/2);
        
        return shape;
    }

    function createRoundedBoxGeometry(width, height, depth, radius) {
        const shape = createRoundedRectShape(width, height, radius);
        const extrudeSettings = {
            steps: 1,
            depth: depth,
            bevelEnabled: false
        };
        return new THREE.ExtrudeGeometry(shape, extrudeSettings);
    }

    function createPageTexture(size) {
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        
        ctx.fillStyle = '#f2f0e6';
        ctx.fillRect(0, 0, size, size);
        
        for (let i = 0; i < size; i += 2) {
            ctx.fillStyle = `rgba(0,0,0,${Math.random() * 1})`;
            ctx.fillRect(i, 0, 1, size);
            
            ctx.fillStyle = `rgba(255,240,202,${Math.random() * 0.03})`;
            ctx.fillRect(i + 1, 0, 1, size);
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(4, 1);
        texture.rotation = Math.PI / 2;
        return texture;
    }

    // Load textures
    const textureLoader = new THREE.TextureLoader();

    function loadTexture(url) {
        return new Promise((resolve, reject) => {
            textureLoader.load(url, resolve, undefined, reject);
        });
    }

    function createClothTexture() {
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
    
        // Base color (dark blue to match your existing bookColor)
        ctx.fillStyle = '#0F2345';
        ctx.fillRect(0, 0, 256, 256);
    
        // Create cloth weave pattern
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        ctx.lineWidth = 1;
    
        // Create diagonal pattern
        for (let i = -256; i < 256; i += 4) {
            ctx.beginPath();
            ctx.moveTo(i, 0);
            ctx.lineTo(i + 256, 256);
            ctx.stroke();
            
            ctx.beginPath();
            ctx.moveTo(i, 256);
            ctx.lineTo(i + 256, 0);
            ctx.stroke();
        }
    
        // Add noise for texture
        const imageData = ctx.getImageData(0, 0, 256, 256);
        const data = imageData.data;
        for (let i = 0; i < data.length; i += 4) {
            const noise = Math.random() * 15 - 7.5;
            data[i] += noise;     // R
            data[i + 1] += noise; // G
            data[i + 2] += noise; // B
        }
        ctx.putImageData(imageData, 0, 0);
    
        return canvas;
    }

    Promise.all([
        loadTexture('front-cover.png'),
        loadTexture('spine.png'),
        loadTexture('back-cover.png')
    ]).then(([coverTextTexture, spineTexture, backTextTexture]) => {
        const pagesGeometry = createRoundedBoxGeometry(width - 0.1, height - 0.1, depth, cornerRadius);
        const pagesMaterial = [
            new THREE.MeshStandardMaterial({
                map: createPageTexture(64, 64),
                roughness: 1,
                metalness: 0
            }),
            new THREE.MeshStandardMaterial({
                map: createPageTexture(64, 64),
                roughness: 1,
                metalness: 0
            }),
            new THREE.MeshStandardMaterial({
                map: createPageTexture(64, 64),
                roughness: 0.6,
                metalness: 0
            }),
            new THREE.MeshStandardMaterial({
                map: createPageTexture(64, 64),
                roughness: 0.6,
                metalness: 0
            }),
            new THREE.MeshStandardMaterial({
                map: createPageTexture(64, 64),
                roughness: 0.6,
                metalness: 0
            }),
            new THREE.MeshStandardMaterial({
                map: createPageTexture(64, 64),
                roughness: 1,
                metalness: 0
            })
        ];
        
        const pages = new THREE.Mesh(pagesGeometry, pagesMaterial);
        pages.position.set(0, 0, -0.2);
        
        const coverExtension = 0.04;
        const coverThickness = 0.07;

        // Front cover base
        const frontCoverGeometry = createRoundedBoxGeometry(
            width + coverExtension,
            height + coverExtension,
            coverThickness,
            cornerRadius
        );
        
        const bookColor = 0x0F2345;
        const pngColor = 0xFFD700;

        const clothTexture = new THREE.CanvasTexture(createClothTexture());
        clothTexture.wrapS = THREE.RepeatWrapping;
        clothTexture.wrapT = THREE.RepeatWrapping;
        clothTexture.repeat.set(0.7, 0.7);

        const coverMaterial = new THREE.MeshStandardMaterial({
            map: clothTexture,
            color: bookColor,
            roughness: 1,
            metalness: 0,
            bumpMap: clothTexture,
            bumpScale: 0.02,
        });
        
        const frontCover = new THREE.Mesh(frontCoverGeometry, coverMaterial);
        frontCover.position.z = depth/2 + coverThickness/2;

        // Front cover text overlay
        const frontTextGeometry = createRoundedBoxGeometry(
          width + coverExtension,
          height + coverExtension,
          0.001,  // Very thin depth
          cornerRadius
      );

      const frontText = new THREE.Mesh(frontTextGeometry, new THREE.MeshStandardMaterial({
        map: coverTextTexture,
        transparent: true,
        alphaTest: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide,
        metalness: 1,
        roughness: 0.2,
        color: pngColor,
        emissive: 0xFFD700, // Same color for glow
    emissiveIntensity: 0.2,  // Intensity of the glow
    bumpMap: coverTextTexture,  // Adding just this line
    bumpScale: 0.005 
    }));
    // Add these lines after creating frontText
        coverTextTexture.repeat.set(0.3, 0.3);  // Adjust these values as needed for size
        coverTextTexture.center.set(0.5, 0.5);
        coverTextTexture.offset.set(0, 0);
        coverTextTexture.needsUpdate = true;

        frontText.position.z = depth/2 + coverThickness/2 + 0.08;
        frontText.position.y = 0;
        frontText.position.x = 0;

        // Back cover base
        const backCoverGeometry = createRoundedBoxGeometry(
            width + coverExtension,
            height + coverExtension,
            coverThickness,
            cornerRadius
        );
        const backCover = new THREE.Mesh(backCoverGeometry, coverMaterial);
        backCover.position.z = -depth/2 - coverThickness/2;

        // Back cover text overlay
        const backTextGeometry = createRoundedBoxGeometry(
            width + coverExtension,
            height + coverExtension,
            0.001,
            cornerRadius
        );
        const backText = new THREE.Mesh(backTextGeometry, new THREE.MeshStandardMaterial({
            map: backTextTexture,
            transparent: true,
            alphaTest: 0.1,
            depthWrite: false,
            side: THREE.DoubleSide,
            metalness: 1,
            roughness: 0.2,
            color: pngColor,
            bumpMap: coverTextTexture,  // Adding just this line
    bumpScale: 0.005 
        }));

        // Add these lines after creating backText
        backTextTexture.repeat.set(0.3, 0.3);  // Adjust these values as needed
        backTextTexture.center.set(0.5, 0.5);
        backTextTexture.offset.set(0, 0);
        backTextTexture.needsUpdate = true;

        backText.position.z = -depth/2 - coverThickness/2 - 0.002;

        const spineGeometry = new THREE.BoxGeometry(
            coverThickness,
            height + coverExtension,
            depth + (coverThickness * 2)
        );
        const spine = new THREE.Mesh(spineGeometry, coverMaterial);
        spine.position.x = -width/2 - coverThickness/2;
        spine.position.z += 0.03;

        const spineTextGeometry = new THREE.BoxGeometry(
            0.001,
            height + coverExtension,
            depth + 0.14
        );

        const spineText = new THREE.Mesh(spineTextGeometry, new THREE.MeshStandardMaterial({
            map: spineTexture,
            transparent: true,
            alphaTest: 0.1,
            depthWrite: false,
            side: THREE.DoubleSide,
            metalness: 1,
            roughness: 0.2,
            bumpMap: coverTextTexture,  // Adding just this line
    bumpScale: 0.005 
        }));

        // Add these lines after creating spineText
            spineTexture.repeat.set(1, 1);  // Adjust these values as needed
            spineTexture.center.set(0.5, 0.5);
            spineTexture.offset.set(0, 0);
            spineTexture.needsUpdate = true;

        spineText.position.x = -width/2 - 0.075;
        spineText.position.z = 0.035;
        spineText.position.y = 0;


        const book = new THREE.Group();
        book.add(pages);
        book.add(frontCover);
        book.add(frontText);
        book.add(backCover);
        book.add(backText);
        book.add(spine);
        book.add(spineText);

        book.rotation.y = -0.5;
        scene.add(book);
    });

    function animate() {
        requestAnimationFrame(animate);
        controls.update();
        // updateLights();
        renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}