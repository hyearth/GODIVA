import '../scss/index.scss';
import './_common.js';
// import * as THREE from 'three';
import * as THREE from '/node_modules/three/build/three.module.js';
import * as state from './_state';
import gsap from 'gsap'; 
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";
import { $html, $body, areaWidth, areaHeight, _DEBUG, MODEL_PATH, onAssetLoaded, HDR_PATH } from './_common.js';
import { setPIP, setGuiModel, setGuiLight } from './_utils';

(() => {




    const $godiva = document.querySelector('#godiva');
    const $modelCon = $godiva.querySelector('.modelCt');
    const $model = $godiva.querySelector('#model');
    const $sections = Array.from($godiva.querySelectorAll('section'));
    const numSections = $sections.length;
    const $footer = document.querySelector('#footer');
    let contentHeight = $footer.offsetTop;


    //timeline
    const timeline = gsap.timeline({ paused: true });
    const timelineTimeStamps = [0];
    let totalDuration = 0;



    let fabBox, fabBoxSize, fabBoxHeight;
    let scrollY;
    let model;
    let mesh01,mesh02,mesh03,mesh04,mesh05
    let frontWheel = []
    const modelMeshes = {
        wheel: [],
        curve:[],
        frame:[],
        line: null,
        chain:null,
      }

    let requestToRender = true;

 
    // ---*Scene 
    const scene = new THREE.Scene();
    // ---*Camera
    const camera = new THREE.PerspectiveCamera(60, areaWidth / areaHeight, 1, 9999);
    camera.aspect = areaWidth / areaHeight;
    camera.updateProjectionMatrix(); //투영 업데이트
    camera.position.set(0, 0, 5); //위치

    const cameraTarget = scene.position.clone();
    camera.lookAt(cameraTarget);
    const cameraOffset = { x: 0, y: 0 };
    const cameraRotateGroupX = new THREE.Group();
    const cameraRotateGroupY = new THREE.Group();
    cameraRotateGroupX.add(cameraRotateGroupY);
    cameraRotateGroupY.add(camera);
    scene.add(cameraRotateGroupX);

    // ---*Renderer 
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));//렌더 품질 조정
    // renderer.setClearColor(new THREE.Color(0x5a3105));//배경색상

    renderer.setSize(areaWidth, areaHeight); //캔버스 사이즈 
    renderer.toneMapping = THREE['Linear' + 'ToneMapping'];//전반적인 Canvas의 톤 보정(대비감 적당하도록)
    renderer.outputEncoding = THREE.sRGBEncoding; // 색상 보정(색 진하게 적당히 조정)
    renderer.toneMappingExposure = 1.5; //전반적인 canvas 밝기 조정
    renderer.shadowMap.enabled = true;//그림자 여부
    renderer.shadowMap.type = THREE.PCFShadowMap;//그림자 부드럽거ㅔ
    $model.appendChild(renderer.domElement);

    // ---*bg
    // const bg = document.createElement('canvas');
    // const ctx = bg.getContext('2d');
    // bg.width = areaWidth;
    // bg.height = areaHeight;
    // const gradient = ctx.createLinearGradient(0, 0, 0, bg.height);
    // gradient.addColorStop(0, '#261800');
    // gradient.addColorStop(1, '#633600');
    // ctx.fillStyle = gradient;
    // ctx.fillRect(0, 0, bg.width, bg.height);
    // const texture = new THREE.CanvasTexture(bg);
    // scene.background = texture;
 

    // ---*Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 1);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
    directionalLight.position.set(7, 10, 5);
    const pointLight = new THREE.PointLight(0xffffff, 15, 100);
    pointLight.position.set(-4,-5, 10)
    // directionalLight.shadow.mapSize.width = 2048;
    // directionalLight.shadow.mapSize.height = 2048;
    // directionalLight.shadow.camera.top = 10;
    // directionalLight.shadow.camera.bottom = -10;
    // directionalLight.shadow.camera.left = -10;
    // directionalLight.shadow.camera.right = 10;

    directionalLight.castShadow = true //⭐빛에 castshadow 설정
    directionalLight.shadow.radius = 2 //그림자 블러

    scene.add(ambientLight,directionalLight);

    if (_DEBUG) {
        setGuiLight([directionalLight,pointLight]);
        const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
        scene.add(directionalLightHelper);
        const pointLightHelper = new THREE.PointLightHelper( pointLight, 1 );
        scene.add(pointLightHelper );
    }

    // ---* 지면 
    // const ground = new THREE.Mesh(
    //     new THREE.PlaneGeometry(areaWidth, areaHeight,100,100), // 지면의 크기
    //     new THREE.ShadowMaterial({ opacity: .5 }) // 그림자만 렌더링, 투명도 설정
    // );
    // ground.rotation.x = -Math.PI / 2;
    // ground.position.y = -6.2
    // scene.add(ground)
    // //⭐그림자를 받아줄 도형에 receiveShadow 설정
    // ground.receiveShadow = true



    // ---OrbitControls : 다양한 각도에서 모델 보기 활성화 * Animate에서 
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = true;
    controls.enableDamping = true;//부드러운 카메라 움직임
    controls.dampingFactor = 0.05;
    controls.minPolarAngle = Math.PI / 4.4;
    controls.addEventListener('change', () => {
      renderRequest();
    })

    // ---model load
    const gltfLoader = new GLTFLoader();
    const dracoLoader = new DRACOLoader();//압축모델
    dracoLoader.setDecoderPath('./resources/draco/');//디코딩 파일경로 
    gltfLoader.setDRACOLoader(dracoLoader);//모델 압축 


    //3d 콘텐츠 돔에 삽입
    $model.appendChild(renderer.domElement);


    //임시 3d 
 
    function setModelTest(){

        mesh01 = new THREE.Mesh(new THREE.CylinderGeometry(1,1,.8,32), new THREE.MeshStandardMaterial({ color: 0x5a3105}))
        mesh01.position.set(0, -.5, 0);
        mesh01.rotation.set(0, -1.5, -1.2);
        mesh02= new THREE.Mesh(new THREE.CylinderGeometry(.6,1,1.5,32), new THREE.MeshStandardMaterial({ color: 0x452500}))
        mesh02.position.set(2, -4.5, 0);
        mesh03= new THREE.Mesh(new THREE.SphereGeometry(1,32,32), new THREE.MeshStandardMaterial({ color: 0xfff3d1}))
        mesh03.position.set(0,-8.5, 0);
        const heartShape = new THREE.Shape();
            heartShape.moveTo(0, 0.5);
            heartShape.bezierCurveTo(0.5, 1.5, 1.5, 1.5, 1, 0.5);
            heartShape.bezierCurveTo(1.5, -0.5, 0, -1.5, 0, -1);
            heartShape.bezierCurveTo(0, -1.5, -1.5, -0.5, -1, 0.5);
            heartShape.bezierCurveTo(-1.5, 1.5, -0.5, 1.5, 0, 0.5);
        const heartGeometry = new THREE.ExtrudeGeometry(heartShape, { depth: 0.5, bevelEnabled: true, bevelSize: 0.1 });
        mesh04 = new THREE.Mesh(heartGeometry,new THREE.MeshStandardMaterial({ color: 0xff5d31}));
        mesh04.position.set(-2, -12.5, .5);
        mesh04.scale.set(.8,.8,.8);
        mesh05 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.8, 1.8), new THREE.MeshStandardMaterial({ color: 0x1c4c00}));
        mesh05.position.set(1, -16, 0);

        scene.add(mesh01,mesh02,mesh03,mesh04,mesh05);


        if (_DEBUG) {
            const meshControls = _DEBUG.gui.addFolder('chocolate');
            meshControls.add(mesh04.rotation, 'x', -10, 10, 0.01).name('mesh01 x');
            meshControls.add(mesh04.rotation, 'y', -10, 10, 0.01).name('mesh01 y');
            meshControls.add(mesh04.rotation, 'z', -10, 10, 0.01).name('mesh01 z');
        }

        //kv animation
        const kvTl = gsap.timeline();
        // kvTl.fromTo(mesh01.position,{x:0,y: -5,z:0,}, {x:0,y: -.5,z:0, duration:1, ease: 'ease-in-out' },);
        // kvTl.fromTo(mesh01.rotation,{x:0,y: -5,z:0,}, {x:0,y: -1.5,z:-1.2, duration:1, ease: 'ease-in-out' },"<=");





    }
    setModelTest()


    //모델 로드 
    function setModel(){
       

        gltfLoader.load(MODEL_PATH + 'test.glb', (gltf) => {

            model = gltf.scene; //model 의 scene
            model.scale.multiplyScalar(2);//model 객체 조작 | 크기조정
            model.position.set(0, -10, 0); //위치 수정
          
            scene.add(model);

            //모델 기본 디자인 수정
            model.traverse((child) => {
                if (child.isMesh) {  // ✅ Mesh인지 확인 필수!
                    console.log(child.material); // ✅ 현재 재질 확인
        
                    // 유리 재질 적용
                    child.material.transparent = true;
                    child.material.opacity =1;
                    child.material.depthWrite = false;
                    // child.material.alphaTest = 0.5;
                    child.material.side = THREE.DoubleSide;  // ✅ 양면 렌더링
                    child.material.roughness = 0;  // ✅ 매끄럽게
                    child.material.metalness = 0.9; // ✅ 반사 효과 추가
                }

            })


            if (_DEBUG) {
                // const meshControls = _DEBUG.gui.addFolder('mesh');
                // meshControls.add(modelMeshes.wheel.material, 'metalness', 0, 1, 0.01).name('wheel metal');
                // meshControls.add(modelMeshes.wheel.material, 'roughness', 0, 1, 0.01).name('wheel rough');
                // meshControls.add(modelMeshes.curve.material, 'metalness', 0, 1, 0.01).name('curve metal');
                // meshControls.add(modelMeshes.curve.material, 'roughness', 0, 1, 0.01).name('curve rough');
                // meshControls.add(modelMeshes.frame.material, 'metalness', 0, 1, 0.01).name('frame metal');
                // meshControls.add(modelMeshes.frame.material, 'roughness', 0, 1, 0.01).name('frame rough');
        
            }



            //모델 등장 애니메이션
            const mTl = gsap.timeline();


            //3d 박스 사이즈 저장
            fabBoxSize = new THREE.Box3().setFromObject(model);
            fabBoxHeight = fabBoxSize.max.y - fabBoxSize.min.y;


            createEnvironment();
            onAssetLoaded('model');

        })
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
    
    //timeline animation 
    function createTimeline(){
        let duration = 1, ease = 'cubic.inOut';
        let areaInfo, cameraDistance;
        
 

        areaInfo = getAreaInfo($sections[1]);
        timeline.to(mesh01.rotation, {x:-1, y:-3.8,z:-1.2, duration, ease },'seq-1');
        timeline.to(mesh01.position, {x:-1, y:-.5,z:0, duration, ease },'seq-1');
        timeline.to(camera.position, {x:0, y:-.5,z:3.5, duration, ease },'seq-1');
        timelineTimeStamps.push(timeline.totalDuration());

        areaInfo = getAreaInfo($sections[2]);
        timeline.to(mesh01.rotation, {x:-1, y:-1.5,z:-1.2, duration, ease },'seq-2');
        timeline.to(mesh02.rotation, {x:0, y:1.34,z:0.7, duration, ease },'seq-2');
        timeline.to(mesh02.position, {x:2, y:-4,z:0, duration, ease },'seq-2');
        timeline.to(camera.position, {x:0,y:-4,z:3.5, duration, ease },'seq-2');
        timelineTimeStamps.push(timeline.totalDuration());

        areaInfo = getAreaInfo($sections[3]);
        timeline.to(mesh02.rotation, {x:0, y:0,z:0, duration, ease },'seq-3');
        timeline.to(mesh03.position, {x:0, y:-7.5,z:0, duration, ease },'seq-3');
        timeline.to(camera.position, {x:0,y:-7.5,z:3.5, duration, ease },'seq-3');
        timelineTimeStamps.push(timeline.totalDuration());


        areaInfo = getAreaInfo($sections[4]);
        timeline.to(mesh03.rotation, {x:0, y:0,z:0, duration, ease },'seq-4');
        timeline.to(mesh04.rotation, {x:-.8, y:-2,z:-.8, duration, ease },'seq-4');
        timeline.to(mesh04.position, {x:-2, y:-12,z:0, duration, ease },'seq-4');
        timeline.to(camera.position, {x:0,y:-12,z:4, duration, ease },'seq-4');
        timelineTimeStamps.push(timeline.totalDuration());

        areaInfo = getAreaInfo($sections[5]);
        timeline.to(mesh04.rotation, {x:0, y:0,z:0, duration, ease },'seq-5');
        timeline.to(mesh05.rotation, {x:1, y:-1.3,z:-2.4, duration, ease },'seq-5');
        timeline.to(mesh05.position, {x:1, y:-16,z:0, duration, ease },'seq-5');
        timeline.to(camera.position, {x:0,y:-16,z:4, duration, ease },'seq-5');
        timelineTimeStamps.push(timeline.totalDuration());

        areaInfo = getAreaInfo($sections[6]);
        timeline.to(mesh01.position, {x:0, y:-16,z:0, duration, ease },'seq-6');
        timeline.to(mesh02.position, {x:0, y:-16,z:0, duration, ease },'seq-6');
        timeline.to(mesh03.position, {x:0, y:-16,z:0, duration, ease },'seq-6');
        timeline.to(mesh04.position, {x:0, y:-16,z:0, duration, ease },'seq-6');
        timeline.to(mesh05.position, {x:0, y:-16,z:0, duration, ease },'seq-6');
        timeline.to(mesh05.rotation, {x:0, y:0,z:0, duration, ease },'seq-6');
        timeline.to(camera.position, {x:0,y:-16,z:10, duration, ease },'seq-6');
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
        renderer.render(scene, camera);
        //controls.update()//오비컨틀롤이 활성호 되었을때만 
    }

    // setModel()
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

 


    function onScroll () {

        const scrollTop = window.pageYOffset;


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

        createTimeline();
        renderRequest();
        
    }
    onResize();
   
    state.on('ready', onReady);
    state.on('scroll', onScroll);
    state.on('resize', onResize);

})();