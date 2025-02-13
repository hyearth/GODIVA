import '../scss/index.scss';
import './_common.js';
import * as state from './_state';
import { $html, $body, areaWidth, areaHeight, _DEBUG, MODEL_PATH, onAssetLoaded, RESOURCES_PATH, HDR_PATH, PI, _CONTROL, PI2 } from './_common.js';


// 외부 라이브러리
// import * as THREE from 'three';
import * as THREE from "https://unpkg.com//three@0.173.0/build/three.module.js"
import { GLTFLoader } from "https://unpkg.com/three@0.173.0/examples/jsm/loaders/GLTFLoader.js";
import { OrbitControls } from "https://unpkg.com/three@0.173.0/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "https://unpkg.com/three@0.173.0/examples/jsm/loaders/DRACOLoader.js";
import { RGBELoader } from "https://unpkg.com/three@0.173.0/examples/jsm/loaders/RGBELoader.js";

// import { gsap } from "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";
// import "https://cdnjs.cloudflare.com/ajax/libs/gsap/3.12.5/gsap.min.js";


import { Box3, Vector3 } from "three";
// import gsap from 'gsap';
//import gsap from './node-modules/gsap/index.js';

// import { RGBELoader } from 'three/examples/jsm/loaders/RGBELoader';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
// import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader';
// import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader';



// 유틸리티
import { setPIP, setGuiModel, setGuiLight } from './_utils';
// import { calcBasisFunctionDerivatives } from 'three/examples/jsm/curves/NURBSUtils.js';

(() => {


    const $godiva = document.querySelector('#godiva');
    const $modelCon = $godiva.querySelector('.modelCt');
    const $model = $godiva.querySelector('#model');
    const $sections = Array.from($godiva.querySelectorAll('section'));
    const numSections = $sections.length;
    const $footer = document.querySelector('#footer');
    let contentHeight = $footer.offsetTop;


    let lenis;

    //timeline
    const timeline = gsap.timeline({ paused: true });
    let timelineTimeStamps = [0];
    let totalDuration = 0;
    let timelineSequenceIndex;

    let fabBox, fabBoxSize, fabBoxHeight;
    let scrollY;
    let model
    
   

    let requestToRender = true;

    let initModelState = {
        mesh0: {
            position: {},
            rotation: {},
        },
        mesh1: {
            position: {},
            rotation: {},
        },
        mesh2: {
            position: {},
            rotation: {},
        },
        mesh3: {
            position: {},
            rotation: {},
        },
        mesh4: {
            position: {},
            rotation: {},
        },
        mesh5: {
            position: {},
            rotation: {},
        },
        mesh6: {
            position: {},
            rotation: {},
        },
       
    };
   

 
    // ---*Scene 
    const scene = new THREE.Scene();
    // ---*Camera
    const camera = new THREE.PerspectiveCamera(60, areaWidth / areaHeight, 1, 9999);
    camera.aspect = areaWidth / areaHeight;
    camera.updateProjectionMatrix(); //투영 업데이트
    camera.position.set(0, 0, 12); //위치
    const cameraTarget = scene.position.clone();
    camera.lookAt(cameraTarget);
    const cameraOffset = { x: 0, y: 0 };
    const cameraRotateGroupX = new THREE.Group();
    const cameraRotateGroupY = new THREE.Group();
    cameraRotateGroupX.add(cameraRotateGroupY);
    cameraRotateGroupY.add(camera);
    scene.add(cameraRotateGroupX);

    if (_DEBUG) {
        const camControl = _DEBUG.gui.addFolder('camera');
        camControl.add(camera.position, 'x', -100, 100, 0.01).name('cam pos x');
        camControl.add(camera.position, 'y', -100, 100, 0.01).name('cam pos y');
        camControl.add(camera.position, 'z', -100, 100, 0.01).name('cam pos z');
        camControl.add(camera.rotation, 'x', -100, 100, 0.01).name('cam rote x');
        camControl.add(camera.rotation, 'y', -100, 100, 0.01).name('cam rote y');
        camControl.add(camera.rotation, 'z', -100, 100, 0.01).name('cam rote z');
        camControl.add(cameraRotateGroupX.rotation, 'y', -100, 100, 0.01).name('rota x');
        camControl.add(cameraRotateGroupY.rotation, 'x', -100, 100, 0.01).name('am rota y');
    }

    // ---*Renderer 
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));//렌더 품질 조정
    renderer.setSize(areaWidth, areaHeight); //캔버스 사이즈 
    renderer.toneMapping = THREE['Linear' + 'ToneMapping'];//전반적인 Canvas의 톤 보정(대비감 적당하도록)
    renderer.outputEncoding = THREE.sRGBEncoding; // 색상 보정(색 진하게 적당히 조정)
    renderer.toneMappingExposure = 1; //전반적인 canvas 밝기 조정
    renderer.shadowMap.enabled = true;//그림자 여부
    renderer.shadowMap.type = THREE.PCFShadowMap;//그림자 부드럽게
    $model.appendChild(renderer.domElement);

    // ---*bg


    // ---*Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);

    const directionalLight = new THREE.DirectionalLight(0xfffbef, 2);
    directionalLight.position.set(-6, 10, 10);

    const directionalLight2 = new THREE.DirectionalLight(0xfffbef, 1);
     directionalLight2.position.set(0, -12, 5);

     //그림자맵핑이 너무 작을떄 
    //  directionalLight2.shadow.mapSize.width = 2048;
    // directionalLight2.shadow.mapSize.height = 2048;
    // directionalLight2.shadow.camera.top = 20;
    // directionalLight2.shadow.camera.bottom = -20;
    // directionalLight2.shadow.camera.left = -20;
    // directionalLight2.shadow.camera.right = 20;
    // directionalLight2.shadow.camera.near = 0.1;
    // directionalLight2.shadow.camera.far = 100;
    // directionalLight2.shadow.radius = 5; 
    // const pointLight = new THREE.PointLight(0xfffbef, 1, 100);

    const pointLight = new THREE.PointLight(0xfffbef, 2, 200);

    scene.add(ambientLight,directionalLight,pointLight);

    if (_DEBUG) {
        setGuiLight([directionalLight,pointLight]);
        const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
        scene.add(directionalLightHelper);
        const pointLightHelper = new THREE.PointLightHelper( pointLight, 1 );
        scene.add(pointLightHelper );
       
    }

    // ---* 지면 
    // 🌊 셰이더 (Shader) 코드
    // void main() {
    //     gl_Position = vec4(position, 1.0);
    // }
    const vertexShader = `
         void main() {
              gl_Position = vec4( position, 1.0 );
          }
    `;
    // uniform float time;
    // uniform vec2 resolution;

    // void main() {
    //     vec2 uv = gl_FragCoord.xy / resolution.xy;
    //     float color = 0.5 + 0.5 * sin(time + uv.x * 5.0);
    //     gl_FragColor = vec4(vec3(color), 1.0);
    // }

    const fragmentShader = `
#ifdef GL_ES
precision mediump float;
#endif
uniform float time;
uniform vec2 resolution;

const int   complexity      =3;  
const float fluid_speed     = 5.0;  
const float color_intensity = 1.0;  

float random (in vec2 st) {
   return fract(sin(dot(st.xy,
                        vec2(12.9898,78.233)))
                * 43758.5453123);
}

void main(){
   vec2 uv = (gl_FragCoord.xy * 2.0 - resolution.xy) / min(resolution.x, resolution.y);

   float r = sqrt( dot( uv, uv ) );
   for(int i=1;i<complexity;i++){
       vec2 newUv = uv + time*0.01; 

       newUv.x+= 1.5/float(i) * 
               sin(float(i) * uv.y + time/fluid_speed) 
               + 1.0;
       
       newUv.y+= 1.4/float(i) * 
               cos(float(i) * uv.x + time/fluid_speed) 
               - 0.9;
       uv=newUv;
   }

   //색빠진황토:vec3(0.882, 0.808, 0.588)
   //밝은노랑:fef2ad: (0.996, 0.949, 0.678)
   //화이트:ffffff: (1.0, 1.0, 1.0)
   //색빠진 노랑 :vec3(0.937, 0.894, 0.769)
   vec3 col = mix(
       vec3(0.882, 0.808, 0.588),
       vec3(1.0, 1.0, 1.0),    
       sin(uv.x + time * 0.01) * 0.5 + 0.5
   );

   gl_FragColor = vec4(col, 1.0);
}
    `;

    // 🖌️ 셰이더 머티리얼 생성
    const planMaterial = new THREE.ShaderMaterial({
    uniforms: {
        time: { type: "f", value: 1.0 },
        resolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) },
    },
    vertexShader,
    fragmentShader,
    depthTest: false, // *깊이 테스트 비활성화
    depthWrite: false,// *깊이 버퍼에 기록하지 않음
    });
    // const textureLoader = new THREE.TextureLoader();
    // const glodtTexture = textureLoader.load("./resources/images/bg_texture.jpg", (texture) => {
    //     texture.encoding = THREE.sRGBEncoding;
    // });

    const planGeometry = new THREE.PlaneGeometry(areaWidth,areaHeight);
    const plan = new THREE.Mesh(planGeometry, planMaterial);
    scene.add(plan);
    plan.rotation.set(0,0,-10)
   // const planMaterial = new THREE.MeshBasicMaterial({ map: glodtTexture }); // 텍스처 적용
   // const plane = new THREE.Mesh(planGeometry, planMaterial);
    // scene.add(plane); // 씬에 추가
  
    
    // ---OrbitControls : 다양한 각도에서 모델 보기 활성화 * Animate에서 
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
    controls.enableDamping = true;//부드러운 카메라 움직임
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = Math.PI / 4.4;
    controls.addEventListener('change', () => {
      renderRequest();
    })
    //
  


    // ---model load
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();//압축모델
   // dracoLoader.setDecoderPath('./resources/draco/');//디코딩 파일경로 
    dracoLoader.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.6/'); 
    gltfLoader.setDRACOLoader(dracoLoader);//모델 압축 


    //3d 콘텐츠 돔에 삽입
    $model.appendChild(renderer.domElement);



    function saveInitModelPos(model,num){
        let meshKey = `mesh${num}`;
        if (!initModelState[meshKey]) {
            initModelState[meshKey] = {
                position: {},
                rotation: {},
            };
        }

        initModelState[meshKey].position = {
            x: model.position.x,
            y: model.position.y,
            z: model.position.z,
        };

        initModelState[meshKey].rotation = {
            x: model.rotation.x,
            y: model.rotation.y,
            z: model.rotation.z,
        };


    }

    // loading
     const $loading = document.querySelector('#loading');
 
     THREE.DefaultLoadingManager.onProgress = function (url, itemsLoaded, itemsTotal) {
        if (itemsLoaded === itemsTotal) {
            setTimeout(()=>{ $loading.classList.add('hide');},1000)
            if(model){
               // gsap.from(model.position, {x: -Math.PI * 10, duration:2, ease: 'ease-in-out',onComplete: createTimeline() },);
                model.traverse((child)=>{
                   
                })

            }
           
        }
     };
 
     const textureLoader = new THREE.TextureLoader()
     const metalBaseColor = textureLoader.load('/resources/images/textures_mesh05.jpg')
     const dirtNormalMap = textureLoader.load('/resources/images/dirt_normal.jpg')
     const stoneRoughMap = textureLoader.load('/resources/images/stone_rough.jpg')
    //모델 로드 
    function setModel(){

        gltfLoader.load(MODEL_PATH + 'model.glb', (gltf) => {

            model = gltf.scene; 
            model.position.set(0,-.5,8.2)
            model.rotation.set(-1.5,0,0)
            scene.add(model);

             if (_DEBUG) {
                    const meshControls = _DEBUG.gui.addFolder('model');
                    meshControls.add(model.position, 'x', -20, 20, 0.01).name('model pos x');
                    meshControls.add(model.position, 'y', -20, 20, 0.01).name('model pos y');
                    meshControls.add(model.position, 'z', -20, 20, 0.01).name('model pos z');
                    meshControls.add(model.rotation, 'x', -20, 20, 0.01).name('model x');
                    meshControls.add(model.rotation, 'y', -20, 20, 0.01).name('model y');
                    meshControls.add(model.rotation, 'z', -20, 20, 0.01).name('model z');
            }

            model.traverse((child) => {
             console.log(child)
               // if(child.isMesh){
                     //그림자
                     child.castShadow = true;
                     child.receiveShadow = true; 
                     if(child.name === ("Lid")){
                        child.material = child.material.clone();//기존 material을 복제하여 형제들과 공유하지 않도록 

                        child.material.transparent = true;
                        child.material.opacity = 0;

                        saveInitModelPos(child,0)
                        child.position.set(-120,120,0)
                        child.rotation.set(0,0,2.5)

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('mesh cover');
                            meshControls.add(child.position, 'x', -20, 20, 0.01).name('cover pos x');
                            meshControls.add(child.position, 'y', -20, 20, 0.01).name('cover pos y');
                            meshControls.add(child.position, 'z', -20, 20, 0.01).name('cover pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('cover rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('cover rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('cover rote z');
                        }
                     }
                     if(child.name === ('Lady')){

                        saveInitModelPos(child,1)
                        child.position.set(0,560,0)
                        child.rotation.set(2.8,-0.3,0.5)
                        child.material.color.set(0x432000);

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('mesh lady');
                            meshControls.add(child.position, 'x', -20, 20, 0.01).name('lady pos x');
                            meshControls.add(child.position, 'y', -20, 20, 0.01).name('lady pos y');
                            meshControls.add(child.position, 'z', -20, 20, 0.01).name('lady pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('lady rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('lady rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('lady rote z');

                            const materControls = meshControls.addFolder('Texture');
                            materControls.add(child.material, 'metalness',0, 1, 0.01).name('metal');
                            materControls.add(child.material, 'roughness', 0, 1, 0.01).name('rough');
                        }

                     }
                     if(child.name === ('Lady_Half')){
                        // saveInitModelPos(child,1)
                        child.position.set(-2,480,45)
                        child.rotation.set(1,9.7,4.5)

                        // child.traverse((elem)=>{
                            
                        //     if(elem.isMesh){
                        //         elem.material = elem.material.clone();///*
                        //         elem.material.transparent = true;
                        //         elem.material.opacity = 0;
                        //     }
                        // })

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('lady half');
                            meshControls.add(child.position, 'x', -20, 20, 0.01).name('lady half pos x');
                            meshControls.add(child.position, 'y', -500, 500, 0.01).name('lady half pos y');
                            meshControls.add(child.position, 'z', -100, 100, 0.01).name('lady half pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('lady half rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('lady half rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('lady half rote z');
                     
                            // const materControls = meshControls.addFolder('Texture');
                            // materControls.add(child.material, 'metalness',0, 1, 0.01).name('metal');
                            // materControls.add(child.material, 'roughness', 0, 1, 0.01).name('rough');
                        }

                     }
                     if(child.name === ('Altruism')){
                        saveInitModelPos(child,2)
                        child.position.set(50,480,0)
                        child.rotation.set(2,-0.5,0.2)


                        const textureBaseColor = textureLoader.load('/resources/images/textures_mesh05.jpg')
                        const textureNormalMap = textureLoader.load('/resources/images/glossy_normal.png')
                        const textureRoughMap = textureLoader.load('/resources/images/glossy_rough.png')

                       
                         child.material = new THREE.MeshStandardMaterial({
                           // map: textureBaseColor,
                            normalMap: textureNormalMap,
                            roughnessMap: textureRoughMap,
                        });
                        // child.material.metalness = 0.0;
                        // child.material.roughness = 0.15; 
                      //  child.material.color.set(0xffc9c9); 
                        child.material.color.set(0xff3030); 
                        // child.material.map.repeat.x=0.8
                        // child.material.map.repeat.y=0.8
                        // child.material.map.offset.x=0.08

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('mesh Altruism');
                            meshControls.add(child.position, 'x', -20, 20, 0.01).name('Altruism pos x');
                            meshControls.add(child.position, 'y', -20, 20, 0.01).name('Altruism pos y');
                            meshControls.add(child.position, 'z', -20, 20, 0.01).name('Altruism pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('Altruism rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('Altruism rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('Altruism rote z');
                           
                            const materControls = meshControls.addFolder('Texture');
                            materControls.add(child.material, 'metalness',0, 1, 0.01).name('metal');
                            materControls.add(child.material, 'roughness', 0, 1, 0.01).name('rough');

                            if (child.material.map) {
                                const texture = child.material.map;
                                
                                const mapFolder = meshControls.addFolder('map');
                                mapFolder.add(texture.repeat, 'x', -5, 5, 0.1).name('repeat X');
                                mapFolder.add(texture.repeat, 'y', -5, 5, 0.1).name('repeat Y');
                                mapFolder.add(texture.offset, 'x', -1, 1, 0.01).name('offset X');
                                mapFolder.add(texture.offset, 'y', -1, 1, 0.01).name('offset Y');
                                mapFolder.add(texture, 'rotation', 0, Math.PI * 2, 0.01).name('rotation');
                            }
                        }

                     }
                     if(child.name === ('Altruism_Half')){

                       // saveInitModelPos(child,2)
                        child.position.set(125,330,-10)
                        child.rotation.set(1.5,1.4,0)

                       
                        child.traverse((elem)=>{
                            if(elem.isMesh){
                                // elem.material = elem.material.clone();///*
                                // elem.material.transparent = true;
                                // elem.material.opacity = 0;

                                if(elem.name === ('Altruism_Half_2')){
                                    elem.material = new THREE.MeshStandardMaterial({
                                        normalMap: dirtNormalMap,
                                        roughnessMap: stoneRoughMap,
                                    });
                                    elem.material.color.set(0xff3030); 
                                }
                            }
                           
                        })
                       
                       

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('Altruism half');
                            meshControls.add(child.position, 'x', -200, 200, 0.01).name('Altruism half pos x');
                            meshControls.add(child.position, 'y', -500, 500, 0.01).name('Altruism half pos y');
                            meshControls.add(child.position, 'z', -20, 20, 0.01).name('Altruism half pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('Altruism half rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('Altruism half rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('Altruism half rote z');
                        }

                     }
                     if(child.name === ('Nobility')){
                        saveInitModelPos(child,3)
                        child.scale.multiplyScalar(0.96);
                        child.position.set(-50,420,0)
                        child.rotation.set(0,1.5,0)

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('mesh Nobility');
                            meshControls.add(child.position, 'x', -500, 500, 0.01).name('Nobility pos x');
                            meshControls.add(child.position, 'y', -500, 500, 0.01).name('Nobility pos y');
                            meshControls.add(child.position, 'z', -500, 500, 0.01).name('Nobility pos z');
                            meshControls.add(child.rotation, 'x', -500, 500, 0.01).name('Nobility rote x');
                            meshControls.add(child.rotation, 'y', -500, 500, 0.01).name('Nobility rote y');
                            meshControls.add(child.rotation, 'z', -500, 500, 0.01).name('Nobility rote z');
                        }

                     }
                     if(child.name === ('Nobility_Half')){
                       // saveInitModelPos(child,3)
                       child.scale.multiplyScalar(0.96);
                        child.position.set(-40,240,-10)
                        child.rotation.set(1.8,0.2,2)

                        // child.traverse((elem)=>{
                        //     if(elem.isMesh){
                        //         elem.material = elem.material.clone();///*
                        //         elem.material.transparent = true;
                        //         elem.material.opacity = 0;
                        //     }
                        // })
                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('Nobility half');
                            meshControls.add(child.position, 'x', -500, 500, 0.01).name('Nobility half pos x');
                            meshControls.add(child.position, 'y', -500, 500, 0.01).name('Nobility half pos y');
                            meshControls.add(child.position, 'z', -500, 500, 0.01).name('Nobility half pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('Nobility half rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('Nobility half rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('Nobility half rote z');
                        }

                     }
                     if(child.name === ('Brave')){
                        saveInitModelPos(child,4)
                        child.position.set(-100,300,0)
                        child.rotation.set(8,-0.6,2.8)


                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('mesh Brave');
                            meshControls.add(child.position, 'x', -500, 500, 0.01).name('Brave pos x');
                            meshControls.add(child.position, 'y', -500, 500, 0.01).name('Brave pos y');
                            meshControls.add(child.position, 'z', -500, 500, 0.01).name('Brave pos z');
                            meshControls.add(child.rotation, 'x', -500, 500, 0.01).name('Brave rote x');
                            meshControls.add(child.rotation, 'y', -500, 500, 0.01).name('Brave rote y');
                            meshControls.add(child.rotation, 'z', -500, 500, 0.01).name('Brave rote z');
                        }
                        if(child.isMesh){
                             //텍스쳐
                            child.material = new THREE.MeshStandardMaterial({
                                map: metalBaseColor,
                                normalMap: dirtNormalMap,
                                roughnessMap: stoneRoughMap,
                            });
                            child.material.color.set(0xfffeee); 
                            child.material.map.offset.x=0.17
                            child.material.map.offset.y=0.2
                            child.material.roughness = 0.5; 
                            // if (_DEBUG) {
                            
                            //     if (child.material.map) {
                            //         const texture = child.material.map;
                                    
                            //         const textureFolder = meshControls.addFolder('Texture');
                            //         textureFolder.add(texture.repeat, 'x', -5, 5, 0.1).name('repeat X');
                            //         textureFolder.add(texture.repeat, 'y', -5, 5, 0.1).name('repeat Y');
                            //         textureFolder.add(texture.offset, 'x', -1, 1, 0.01).name('offset X');
                            //         textureFolder.add(texture.offset, 'y', -1, 1, 0.01).name('offset Y');
                            //         textureFolder.add(texture, 'rotation', 0, Math.PI * 2, 0.01).name('rotation');
                            //     }
                                
                            // }

                            

                        }

                       

                     }
                     if(child.name === ('Brave_Half001')){
                        // saveInitModelPos(child,4)
                        child.position.set(1.8,0,3.2)
                        child.rotation.set(0,-0.5,1)

                        // child.traverse( elem => {
                        //     if(elem.isMesh){
                        //         elem.material = elem.material.clone();///*
                        //         elem.material.transparent = true;
                        //         elem.material.opacity = 0;
                        //     }
                        // });

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('Brave half');
                            meshControls.add(child.position, 'x', -10,10, 0.01).name('Brave half pos x');
                            meshControls.add(child.position, 'y', -10,10, 0.01).name('Brave half pos y');
                            meshControls.add(child.position, 'z', -10,10, 0.01).name('Brave half pos z');
                            meshControls.add(child.rotation, 'x', -10,10, 0.01).name('Brave half rote x');
                            meshControls.add(child.rotation, 'y', -10,10, 0.01).name('Brave half rote y');
                            meshControls.add(child.rotation, 'z', -10,10, 0.01).name('Brave half rote z');
                        }

                     }
                     if(child.name === ('Generosity')){
                        saveInitModelPos(child,5)
                        child.position.set(100,240,0)
                        child.rotation.set(2,0.6,2.4)

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('mesh Generosity');
                            meshControls.add(child.position, 'x', -500, 500, 0.01).name('Generosity pos x');
                            meshControls.add(child.position, 'y', -500, 500, 0.01).name('Generosity pos y');
                            meshControls.add(child.position, 'z', -500, 500, 0.01).name('Generosity pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('Generosity rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('Generosity rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('Generosity rote z');
                        }

                     }
                     if(child.name === ('Generosity_Half')){
                        child.position.set(100,235,-25)
                        child.rotation.set(1,-0.1,4.5)

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('Generosity half');
                            meshControls.add(child.position, 'x', -500, 500, 0.01).name('Generosity half pos x');
                            meshControls.add(child.position, 'y', -500, 500, 0.01).name('Generosity half pos y');
                            meshControls.add(child.position, 'z', -500, 500, 0.01).name('Generosity half pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('Generosity half rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('Generosity half rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('Generosity half rote z');
                        }

                     }
                     if(child.name === ('Trust')){
                        saveInitModelPos(child,6)
                        child.position.set(0,0,0)
                        child.rotation.set(3,1.2,0)

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('mesh Trust');
                            meshControls.add(child.position, 'x', -20, 20, 0.01).name('Trust pos x');
                            meshControls.add(child.position, 'y', -20, 20, 0.01).name('Trust pos y');
                            meshControls.add(child.position, 'z', -20, 20, 0.01).name('Trust pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('Trust rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('Trust rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('Trust rote z');
                        }

                     }
                     if(child.name === ('Trsut_Half')){
                        // saveInitModelPos(child,6)
                        child.position.set(0,0,-10)
                        child.rotation.set(-1.2,3.5,2.5)
                       

                        // child.traverse((elem)=>{
                            
                        //     if(elem.isMesh){
                        //       //  elem.material = elem.material.clone();///*
                        //         // elem.material.transparent = true;
                        //         // elem.material.opacity = 0;
                        //     }
                        // })

                        if (_DEBUG) {
                            const meshControls = _DEBUG.gui.addFolder('Trust Half');
                            meshControls.add(child.position, 'x', -20, 20, 0.01).name('Trust Half pos x');
                            meshControls.add(child.position, 'y', -20, 20, 0.01).name('Trust Half pos y');
                            meshControls.add(child.position, 'z', -20, 20, 0.01).name('Trust Half pos z');
                            meshControls.add(child.rotation, 'x', -20, 20, 0.01).name('Trust Half rote x');
                            meshControls.add(child.rotation, 'y', -20, 20, 0.01).name('Trust Half rote y');
                            meshControls.add(child.rotation, 'z', -20, 20, 0.01).name('Trust Half rote z');
                        }

                     }
                    
            })

             // 모델 사이즈
             fabBoxSize = new THREE.Box3().setFromObject(model);//로드 모델의 경계박스 
             fabBoxHeight = fabBoxSize.max.y - fabBoxSize.min.y;

             createEnvironment();
             onAssetLoaded('model');
          
        })

        createEnvironment();
        onAssetLoaded('model');

    }
    function getAreaInfo ($target, selector) {
        const $area = $target.querySelector(selector || '.mesh-area');
        const rect = $area.getBoundingClientRect();
        const parentRect = $area.parentNode.getBoundingClientRect();
        return {
            left: rect.left,
            top: rect.top - parentRect.top,
            width: rect.width,
            height: rect.height
        };
    }
    function getCameraFov (meshAreaHeight, cameraDistance) {
        const targetHeight = fabBoxHeight * areaHeight / meshAreaHeight;
        return 2 * (180 / Math.PI) * Math.atan(targetHeight / (2 * cameraDistance));
    }
    function getCameraOffset (areaInfo) {
        return {
            x: areaWidth / 2 - areaInfo.width / 2 - areaInfo.left,
            y: areaHeight / 2 - areaInfo.height / 2 - areaInfo.top,
        };
    }
    function updateCameraProjectionMatrix () {
        camera.updateProjectionMatrix();
    }

    //위치 초기화
    function openModelPos(secNum){
        let duration = 1, ease = 'cubic.inOut';
        if(model){
            model.traverse((child) => {
                    if(child.name === ("Lid")){
                        timeline.to(child.position, { x:-160,y:140,z:0, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:0,y:0,z:2.5, duration, ease },`seq-${secNum}`);
                        timeline.to(child.material, {opacity:0, duration, ease },`seq-${secNum}`);
                     }
                     if(child.name === ('Lady')){
                       timeline.to(child.position, { x:0,y:575,z:0, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:2.8,y:-0.3,z:0.5, duration, ease },`seq-${secNum}`);
                     }
                     if(child.name === ('Lady_Half')){
                        timeline.to(child.position, { x:-2,y:480,z:45, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:1,y:9.7,z:4.5, duration, ease },`seq-${secNum}`);
                        // child.traverse((elem)=>{
                        //     if(elem.isMesh){
                        //         timeline.to(elem.material, {opacity:0 , duration:0, ease:"" },`seq-${secNum}`);
                        //     }
                        // })
                     }
                     if(child.name === ('Altruism')){
                        timeline.to(child.position, { x:50,y:480,z:0, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:2,y:-0.5,z:0.2, duration, ease },`seq-${secNum}`);
                     }
                     if(child.name === ('Altruism_Half')){
                        timeline.to(child.position, { x:125,y:330,z:-10, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:1.5,y:1.4,z:0, duration, ease },`seq-${secNum}`);
                        // child.traverse((elem)=>{
                        //     if(elem.isMesh){
                        //         timeline.to(elem.material, {opacity:0 , duration:0, ease:"" },`seq-${secNum}`);
                        //     }
                        // })
                      }
                     if(child.name === ('Nobility')){
                        timeline.to(child.position, { x:-50,y:420,z:0, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:0,y:1.5,z:0, duration, ease },`seq-${secNum}`);
                     }
                     if(child.name === ('Nobility_Half')){
                        timeline.to(child.position, { x:-40,y:240,z:-10, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:1.8,y:0,z:2.2, duration, ease },`seq-${secNum}`);
                        // child.traverse((elem)=>{
                        //     if(elem.isMesh){
                        //         timeline.to(elem.material, {opacity:0 , duration:0, ease:"" },`seq-${secNum}`);
                        //     }
                        // })
                     }
                     if(child.name === ('Brave')){         
                        timeline.to(child.position, { x:-100,y:300,z:0, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:8,y:-0.6,z:2.8, duration, ease },`seq-${secNum}`);
                     }
                     if(child.name === ('Brave_Half001')){
                        timeline.to(child.position, { x:1.8,y:0,z:3.2, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:0,y:-0.5,z:1, duration, ease },`seq-${secNum}`);
                        // child.traverse((elem)=>{
                        //     if(elem.isMesh){
                        //         timeline.to(elem.material, {opacity:0 , duration:0, ease:"" },`seq-${secNum}`);
                        //     }
                        // })
                      
                     }
                     if(child.name === ('Generosity')){
                        timeline.to(child.position, { x:100,y:240,z:0, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:2,y:0.6,z:2.4, duration, ease },`seq-${secNum}`);
                     }
                     if(child.name === ('Generosity_Half')){
                        timeline.to(child.position, { x:100,y:235,z:-25, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:1,y:-0.1,z:4.5, duration, ease },`seq-${secNum}`);
                     }
                    
                     if(child.name === ('Trust')){
                        timeline.to(child.position, { x:0,y:0,z:0, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:3,y:1.2,z:0, duration, ease },`seq-${secNum}`);
                     }
                     if(child.name === ('Trsut_Half')){
                        timeline.to(child.position, { x:0,y:0,z:-10, duration, ease },`seq-${secNum}`);
                        timeline.to(child.rotation, { x:-1.2,y:3.5,z:2.5, duration, ease },`seq-${secNum}`);
                     }
            })
        }
    }
    function closeModelPos(secNum){
        let duration = 1, ease = 'cubic.inOut';
        if(model){
            model.traverse((child) => {
                if(child.name === ('Lady')){
                timeline.to(child.position, {
                    x:initModelState.mesh1.position.x, 
                    y:initModelState.mesh1.position.y,
                    z:initModelState.mesh1.position.z, duration, ease },`seq-${secNum}`);
                timeline.to(child.rotation, {
                        x:initModelState.mesh1.rotation.x, 
                        y:initModelState.mesh1.rotation.y,
                        z:initModelState.mesh1.rotation.z, duration, ease },`seq-${secNum}`);
                }
                if(child.name === ('Altruism')){
                timeline.to(child.position, {
                    x:initModelState.mesh2.position.x, 
                    y:initModelState.mesh2.position.y,
                    z:initModelState.mesh2.position.z, duration, ease },`seq-${secNum}`);
                timeline.to(child.rotation, {
                        x:initModelState.mesh2.rotation.x, 
                        y:initModelState.mesh2.rotation.y,
                        z:initModelState.mesh2.rotation.z, duration, ease },`seq-${secNum}`);
                }
                if(child.name === ('Nobility')){
                timeline.to(child.position, {
                    x:initModelState.mesh3.position.x, 
                    y:initModelState.mesh3.position.y,
                    z:initModelState.mesh3.position.z, duration, ease },`seq-${secNum}`);
                timeline.to(child.rotation, {
                        x:initModelState.mesh3.rotation.x, 
                        y:initModelState.mesh3.rotation.y,
                        z:initModelState.mesh3.rotation.z, duration, ease },`seq-${secNum}`);
                }
                if(child.name === ('Brave')){
                timeline.to(child.position, {
                    x:initModelState.mesh4.position.x, 
                    y:initModelState.mesh4.position.y,
                    z:initModelState.mesh4.position.z, duration, ease },`seq-${secNum}`);
                timeline.to(child.rotation, {
                        x:initModelState.mesh4.rotation.x, 
                        y:initModelState.mesh4.rotation.y,
                        z:initModelState.mesh4.rotation.z, duration, ease },`seq-${secNum}`);
                }
                if(child.name === ('Generosity')){
                timeline.to(child.position, {
                    x:initModelState.mesh5.position.x, 
                    y:initModelState.mesh5.position.y,
                    z:initModelState.mesh5.position.z, duration, ease },`seq-${secNum}`);
                timeline.to(child.rotation, {
                        x:initModelState.mesh5.rotation.x, 
                        y:initModelState.mesh5.rotation.y,
                        z:initModelState.mesh5.rotation.z, duration, ease },`seq-${secNum}`);
                }
                if(child.name === ('Trust')){
                timeline.to(child.position, {
                    x:initModelState.mesh6.position.x, 
                    y:initModelState.mesh6.position.y,
                    z:initModelState.mesh6.position.z, duration, ease },`seq-${secNum}`);
                timeline.to(child.rotation, {
                        x:initModelState.mesh6.rotation.x, 
                        y:initModelState.mesh6.rotation.y,
                        z:initModelState.mesh6.rotation.z, duration, ease },`seq-${secNum}`);
                }
            })
        }
    }
   
    //timeline animation 
    function createTimeline(){
        timeline.clear();
		timelineTimeStamps = [];
        totalDuration = 0;
        timelineSequenceIndex = 0;

        let duration = 1, ease = 'cubic.inOut';
        let areaInfo;
        let cameraDistance;
        let mScrollX;
        let mScrollY;

        if(areaWidth < 769){
            mScrollY = -0.15;
            mScrollX = 0.02;
        }else{
            mScrollY = 0;
            mScrollX = 0;
        }

        //kv
        areaInfo = getAreaInfo($sections[0]);
        cameraDistance = 11 + mScrollY;
        openModelPos(0)
        //*필수
        timeline.to(cameraRotateGroupX.rotation, {y:0, duration, ease },'seq-0');
        timeline.to(cameraRotateGroupY.rotation, {x:0, duration, ease },'seq-0')
        timeline.to(camera.rotation, {x:0, duration, ease },'seq-0');
        timeline.to(camera.position, {x:0, y:5.2,z:cameraDistance, duration, ease },'seq-0');
        timeline.to(camera, { fov: getCameraFov(areaInfo.height, cameraDistance), duration, ease, }, 'seq-0');//시야각
        timeline.to(cameraOffset, { ...getCameraOffset(areaInfo), duration, ease }, 'seq-0');//카메라 원근
        timelineTimeStamps.push(timeline.totalDuration());

        //mesh1 - 레이디
        areaInfo = getAreaInfo($sections[1]);
        cameraDistance = 10.2;
        if(model){
            model.traverse((child) => {
                if(child.name === ("Lady")){
                  timeline.to(child.rotation, {x:2.8, y:Math.PI * 1.9,z:0.3, duration, ease },'seq-1');
                }
                if(child.name === ("Lady_Half")){
                    timeline.to(child.position, {x:-2, y:578,z:-50, duration, ease },'seq-1');
                    timeline.to(child.rotation, {x:0.1, y:9.7,z:5.4, duration, ease },'seq-1');
                    // child.traverse((elem)=>{
                    //     if(elem.isMesh){
                    //         timeline.to(elem.material, {opacity:1,duration:0.2, ease:""},'seq-1');
                    //     }
                    // })
                }
            })
        }
        //*필수
        timeline.to(cameraRotateGroupX.rotation, {y:0.01, duration, ease },'seq-1');
        timeline.to(cameraRotateGroupY.rotation, {x:0, duration, ease },'seq-1')
        timeline.to(camera.rotation, {x:0, duration, ease },'seq-1');
        timeline.to(camera.position, {x:0, y:5.2 + mScrollY,z:cameraDistance, duration, ease },'seq-1');
        timeline.to(camera, { fov: getCameraFov(areaInfo.height, cameraDistance), duration, ease, }, 'seq-1');
        timeline.to(cameraOffset, { ...getCameraOffset(areaInfo), duration, ease }, 'seq-1');
        timelineTimeStamps.push(timeline.totalDuration());

        
         //mesh2 - 하트
         areaInfo = getAreaInfo($sections[2]);
         cameraDistance = 10;
         if(model){
            model.traverse((child) => {
                if(child.name === ("Altruism")){
                    timeline.to(child.rotation, {x:1.5, y:-0.2,z:-Math.PI * 2.15, duration, ease },'seq-2');
                }
                if(child.name === ("Altruism_Half")){
                    timeline.to(child.position, { x:125,y:392,z:-10, duration, ease },`seq-2`);
                    timeline.to(child.rotation, {x:1.5, y:0.7,z:5.8, duration, ease },'seq-2');
                    // child.traverse((elem)=>{
                    //     if(elem.isMesh){
                    //         timeline.to(elem.material, {opacity:1,duration:0.2, ease:""},'seq-2');
                    //     }
                    // })
                }
            })
        }
         //*필수
         timeline.to(cameraRotateGroupX.rotation, {y:0.015 + mScrollX, duration, ease },'seq-2');
         timeline.to(cameraRotateGroupY.rotation, {x:0, duration, ease },'seq-2')
         timeline.to(camera.rotation, {x:0, duration, ease },'seq-2');
         timeline.to(camera.position, {x:0.15, y:4.4+mScrollY,z:cameraDistance, duration, ease },'seq-2');
         timeline.to(camera, { fov: getCameraFov(areaInfo.height, cameraDistance), duration, ease, }, 'seq-2');
         timeline.to(cameraOffset, { ...getCameraOffset(areaInfo), duration, ease }, 'seq-2');
         timelineTimeStamps.push(timeline.totalDuration());

         //mesh3 - 고귀함
         areaInfo = getAreaInfo($sections[3]);
         cameraDistance = 10;
         if(model){
            model.traverse((child) => {
                if(child.name === ("Nobility")){
                    timeline.to(child.rotation, {x:2.5, y:0.2,z:0, duration, ease },'seq-3');
                }
                if(child.name === ("Nobility_Half")){
                    timeline.to(child.position, {x:-40, y:420,z:-10, duration, ease },'seq-3');
                    timeline.to(child.rotation, {x:1.5, y:-0.2,z:-0.5, duration, ease },'seq-3');
                    // child.traverse((elem)=>{
                    //     if(elem.isMesh){
                    //         timeline.to(elem.material, {opacity:1,duration:0.2, ease:""},'seq-3');
                    //     }
                    // })
                }
            })
        }
         //*필수
         timeline.to(cameraRotateGroupX.rotation, {y:-0.015 - mScrollX, duration, ease },'seq-3');
         timeline.to(cameraRotateGroupY.rotation, {x:0, duration, ease },'seq-3')
         timeline.to(camera.rotation, {x:0, duration, ease },'seq-3');
         timeline.to(camera.position, {x:-0.15, y:3.7+mScrollY,z:cameraDistance, duration, ease },'seq-3');
         timeline.to(camera, { fov: getCameraFov(areaInfo.height, cameraDistance), duration, ease, }, 'seq-3');
         timeline.to(cameraOffset, { ...getCameraOffset(areaInfo), duration, ease }, 'seq-3')
         timelineTimeStamps.push(timeline.totalDuration());

          //mesh4 - 용기
          areaInfo = getAreaInfo($sections[4]);
          cameraDistance = 10;
          if(model){
            model.traverse((child) => {
                if(child.name === ("Brave")){
                    timeline.to(child.position, {x:-10, y:330,z:0, duration, ease },'seq-4');
                    timeline.to(child.rotation, {x:2.2, y:-0.6,z:Math.PI * .8, duration, ease },'seq-4');
                }
                if(child.name === ("Brave_Half001")){
                    timeline.to(child.position, {x:0.4, y:0,z:2.45, duration, ease },'seq-4');
                    timeline.to(child.rotation, {x:1.2, y:-0.2,z:0.2, duration, ease },'seq-4');
                    // child.traverse((elem)=>{
                    //     if(elem.isMesh){
                    //         timeline.to(elem.material, {opacity:1,duration:0.2, ease:""},'seq-4');
                    //     }
                    // })
                }
            })
        }
          //*필수
         timeline.to(cameraRotateGroupX.rotation, {y:0,  duration, ease },'seq-4');
         timeline.to(cameraRotateGroupY.rotation, {x:0, duration, ease },'seq-4')
         timeline.to(camera.rotation, {x:0, duration, ease },'seq-4');
          timeline.to(camera.position, {x:0, y:2.7+mScrollY,z:cameraDistance, duration, ease },'seq-4');
          timeline.to(camera, { fov: getCameraFov(areaInfo.height, cameraDistance), duration, ease, }, 'seq-4');
          timeline.to(cameraOffset, { ...getCameraOffset(areaInfo), duration, ease }, 'seq-4')
          timelineTimeStamps.push(timeline.totalDuration());


          //mesh5 - 관용
          areaInfo = getAreaInfo($sections[5]);
          cameraDistance = 10;
          if(model){
            model.traverse((child) => {
                if(child.name === ("Generosity")){
                   timeline.to(child.position, {x:50, y:240,z:0, duration, ease },'seq-5');
                   timeline.to(child.rotation, {x:1.8, y:0.1,z:Math.PI * 1.95, duration, ease },'seq-5');
                }
                if(child.name === ("Generosity_Half")){
                    timeline.to(child.position, {x:25, y:235,z:-25, duration, ease },'seq-5');
                    timeline.to(child.rotation, {x:1.8, y:-0.1,z:0.5, duration, ease },'seq-5');
                 }
            })
        }
          //*필수
          timeline.to(cameraRotateGroupX.rotation, {y:0.015+ mScrollX, duration, ease },'seq-5');
          timeline.to(cameraRotateGroupY.rotation, {x:0, duration, ease },'seq-5')
          timeline.to(camera.rotation, {x:0, duration, ease },'seq-5');
          timeline.to(camera.position, {x:0.15, y:1.9+mScrollY,z:cameraDistance, duration, ease },'seq-5');
          timeline.to(camera, { fov: getCameraFov(areaInfo.height, cameraDistance), duration, ease, }, 'seq-5');
          timeline.to(cameraOffset, { ...getCameraOffset(areaInfo), duration, ease }, 'seq-5')
          timelineTimeStamps.push(timeline.totalDuration());

           //mesh6 - 약속
           areaInfo = getAreaInfo($sections[6]);
           cameraDistance = 10;
           if(model){
                model.traverse((child) => {
                    if(child.name === ("Trust")){
                        timeline.to(child.position, { x:-4,y:150,z:0, duration, ease },`seq-6`);
                        timeline.to(child.rotation, {x:2.2, y:0.4,z:Math.PI * 2 ,duration, ease },'seq-6');
                    }
                    if(child.name == ("Trsut_Half")){
                       timeline.to(child.position, {x:4, y:152,z:-10, duration, ease },'seq-6');
                       timeline.to(child.rotation, {x:1.8, y:-0.1,z:0.5, duration, ease },'seq-6');
                       
                     }
                })
            }
           //*필수
           timeline.to(cameraRotateGroupX.rotation, {y:0, duration, ease },'seq-6');
           timeline.to(cameraRotateGroupY.rotation, {x:0, duration, ease },'seq-6')
           timeline.to(camera.rotation, {x:0, duration, ease },'seq-6');
           timeline.to(camera.position, {x:0, y:1.1+mScrollY,z:cameraDistance, duration, ease },'seq-6');
           timeline.to(camera, { fov: getCameraFov(areaInfo.height, cameraDistance), duration, ease, }, 'seq-6');
           timeline.to(cameraOffset, { ...getCameraOffset(areaInfo), duration, ease }, 'seq-6')
           timelineTimeStamps.push(timeline.totalDuration());



           //mesh7 - 박스
           areaInfo = getAreaInfo($sections[7]);
           cameraDistance = 12;
           closeModelPos(7)
           if(model){
            model.traverse((child) => {
                if(child.isMesh){
                     if(child.name === ("Lid")){
                        timeline.to(child.material, {opacity:0, duration, ease },'seq-7');
                     }
                 }
            })
           }
           //*필수
           timeline.to(cameraRotateGroupX.rotation, {y:0, duration, ease },'seq-7');
           timeline.to(cameraRotateGroupY.rotation, {x:-0.2, duration, ease },'seq-7');//카메라 y 위치
           timeline.to(camera.position, {x:0, y:0,z:cameraDistance, duration, ease },'seq-7');
           timeline.to(camera.rotation, {x:-0.4, duration, ease },'seq-7');//카메라 y 각도
           timeline.to(camera, { fov: getCameraFov(areaInfo.height, cameraDistance), duration, ease, }, 'seq-7');
           timeline.to(cameraOffset, { ...getCameraOffset(areaInfo), duration, ease }, 'seq-7')
           timelineTimeStamps.push(timeline.totalDuration());

           //mesh8 - 박스 닫기
           areaInfo = getAreaInfo($sections[8]);
           cameraDistance = 13;
           closeModelPos(8)
           if(model){
            model.traverse((child) => {
             
                if(child.isMesh){
                     if(child.name === ("Lid")){
                        timeline.to(child.position, {
                            x:initModelState.mesh0.position.x, 
                            y:initModelState.mesh0.position.y,
                            z:initModelState.mesh0.position.z, duration, ease },`seq-8`);
                        timeline.to(child.rotation, {
                                x:initModelState.mesh0.rotation.x, 
                                y:initModelState.mesh0.rotation.y,
                                z:initModelState.mesh0.rotation.z, duration, ease },`seq-8`);
                        timeline.to(child.material, {opacity:1, duration, ease },'seq-8');
                     }
                 }
            })
           }
           //*필수
           timeline.to(cameraRotateGroupX.rotation, {y:0, duration, ease },'seq-8');
        //    timeline.to(cameraRotateGroupY.rotation, {x:-1, duration, ease },'seq-8');//카메라 y 위치
        //    timeline.to(camera.rotation, {x:-0.6,duration, ease },'seq-8');//카메라 y 각도
           timeline.to(cameraRotateGroupY.rotation, {x:0, duration, ease },'seq-8');
           timeline.to(camera.rotation, {x:0,duration, ease },'seq-8');
           timeline.to(camera.position, {x:0, y:0,z:cameraDistance, duration, ease },'seq-8');
           timeline.to(camera, { fov: getCameraFov(areaInfo.height, cameraDistance), duration, ease, }, 'seq-8');
           timeline.to(cameraOffset, { ...getCameraOffset(areaInfo), duration, ease }, 'seq-8')
           timelineTimeStamps.push(timeline.totalDuration());

        
        
        totalDuration = timeline.totalDuration();
        timelineTimeStamps.push(totalDuration);
   
    }
    function createEnvironment () {
        onAssetLoaded('env');
    }

    //출력 *requestAnimationFrame 를 이용해요 모델이 계속 출력 되도로
    function animate() { 
        requestAnimationFrame(animate); 
        planMaterial.uniforms.time.value += 0.03;// 시간 업데이트
        renderer.render(scene, camera);
    }

    setModel()
    animate(); // 애니메이션 루프 시작


    function renderRequest () {
        requestToRender = true;
    }
    function onReady () {
       createTimeline();
       gsap.ticker.add(onTick);
    }

  function onTick (time, deltaTime) {
    if (requestToRender) {

        //controls && controls.update();   

        // camera.setViewOffset(
        //     areaWidth,
        //     areaHeight,
        //     cameraOffset.x,
        //     cameraOffset.y,
        //     areaWidth,
        //     areaHeight
        // );

       // camera.lookAt(cameraTarget);

        //point조명을 카메라와 모델 거리 중간에 위치시킴
        const cameraWorldPosition = new THREE.Vector3();
        const modelWorldPosition = new THREE.Vector3();
        
        camera.getWorldPosition(cameraWorldPosition);
        if(model){
            model.getWorldPosition(modelWorldPosition);
        }

        const midpoint = new THREE.Vector3()
        .addVectors(cameraWorldPosition, modelWorldPosition)
        .multiplyScalar(0.5); // 값이 작아질수록 모델과 가까워짐
        midpoint.x += -1;
        pointLight.position.copy(midpoint);

      if ( _DEBUG && _DEBUG.pip ) {
        renderer.setClearColor(0, 0);
        renderer.setViewport(0, 0, areaWidth, areaHeight);
        renderer.render(scene, camera);
        renderer.setClearColor(0x8f8366, 1);
        renderer.clearDepth();
        renderer.setScissorTest(true);
        renderer.setScissor(areaWidth - _DEBUG.pip.width - 20, 20, _DEBUG.pip.width, _DEBUG.pip.height);
        renderer.setViewport(areaWidth - _DEBUG.pip.width - 20, 20, _DEBUG.pip.width, _DEBUG.pip.height);
        _DEBUG.pip.beforeRender();
        renderer.render(scene, _DEBUG.pip.camera);
        _DEBUG.pip.afterRender();
        renderer.setScissorTest(false);
      } else {
        renderer.render(scene, camera);
      }
    }
  }

 

  function updateShadowCamera() {
    directionalLight.shadow.camera.left = directionalLight.position.x - 20;
    directionalLight.shadow.camera.right = directionalLight.position.x + 20;
    directionalLight.shadow.camera.top = directionalLight.position.y + 20;
    directionalLight.shadow.camera.bottom = directionalLight.position.y - 20;
    directionalLight.shadow.camera.near = 0.1;
    directionalLight.shadow.camera.far = 50;
}
    function onScroll () {

        const scrollTop = window.pageYOffset;

        //updateShadowCamera();

        let $currentSection, currentSectionRect, currentSectionIndex;
        for (let i = 0; i < numSections; i++) {
            const $section = $sections[i];
            const sectionRect = $section.getBoundingClientRect();

            $currentSection = $section;
            currentSectionRect = sectionRect;
            currentSectionIndex = i;
            if (sectionRect.bottom >= 0) {
                break;
            }
        }

	    const progress = -currentSectionRect.top / currentSectionRect.height;

        const timelineStartAt = timelineTimeStamps[currentSectionIndex];
        const timelineEndAt = timelineTimeStamps[Math.min(numSections - 1, currentSectionIndex + 1)];
         timeline.time(Math.min(timelineStartAt + (timelineEndAt - timelineStartAt) * progress, totalDuration));
    }
    function onResize () {


        const pixelRatio = Math.min(2, window.devicePixelRatio);

        camera.aspect = $model.offsetWidth / $model.offsetHeight;
        camera.updateProjectionMatrix();

        renderer.setSize($model.offsetWidth, $model.offsetHeight);
        renderer.setPixelRatio(pixelRatio);

        contentHeight = $footer.offsetTop;
	    $modelCon.style.height = `${contentHeight}px`

        if(model) fabBoxHeight = fabBoxSize.max.y - fabBoxSize.min.y;
   

        createTimeline();
        renderRequest();
        
    }
    onResize();
   
    state.on('ready', onReady);
    state.on('scroll', onScroll);
    state.on('resize', onResize);

})();