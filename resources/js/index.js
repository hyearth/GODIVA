import '../scss/index.scss';
import './_common.js';
import * as THREE from 'three';
import * as state from './_state.js';
import gsap from 'gsap';
import { GLTFLoader, DRACOLoader , RGBELoader ,OrbitControls } from 'three/examples/jsm/Addons.js';
import { $html, $body, areaWidth, areaHeight, _DEBUG, MODEL_PATH, onAssetLoaded, HDR_PATH } from './_common';
import { setPIP, setGuiModel, setGuiLight } from './_utils';

(() => {


    const $bicycle = document.querySelector('#bicycle');
    const $modelCt = $bicycle.querySelector('.modelCt');
    const $model = $bicycle.querySelector('#model');
    const $bikeItem = $bicycle.querySelectorAll('.btnItem');
    const $sections = Array.from($bicycle.querySelectorAll('section'));
    const numSections = $sections.length;
    const $footer = document.querySelector('#footer');

    

    //timeline
    const timeline = gsap.timeline({ paused: true });
    const timelineTimeStamps = [0];
    let totalDuration = 0;



    let fabBox, fabBoxSize, fabBoxHeight;
    let scrollY;
    let model;
    let frontWheel = []
    const modelMeshes = {
        wheel: [],
        curve:[],
        frame:[],
        line: null,
        chain:null,
      }

    let requestToRender = true;


    const settings = {
        // tone: 'Reinhard'
        tone: 'Linear'
    };
 
    // ---*Scene 
    const scene = new THREE.Scene();
    // ---*Camera
    const camera = new THREE.PerspectiveCamera(60, areaWidth / areaHeight, 1, 9999);//각 ,화면비율
    camera.aspect = areaWidth / areaHeight;
    camera.updateProjectionMatrix(); //투영 업데이트
    camera.position.set(0, 0, 20);
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
    // renderer.setClearColor(new THREE.Color('rgb(241, 241, 241)'));

    renderer.setSize(areaWidth, areaHeight); //캔버스 사이즈 
    renderer.toneMapping = THREE[settings.tone + 'ToneMapping'];//전반적인 Canvas의 톤 보정(대비감 적당하도록)
    renderer.outputEncoding = THREE.sRGBEncoding; // 색상 보정(색 진하게 적당히 조정)
    renderer.toneMappingExposure = 1.5; //전반적인 canvas 밝기 조정
    renderer.shadowMap.enabled = true;//그림자 여부
    renderer.shadowMap.type = THREE.PCFShadowMap;//그림자 부드럽거ㅔ
    $model.appendChild(renderer.domElement);
    // ---*bg
    // const textureLoader = new THREE.TextureLoader();
    // const backgroundTexture = textureLoader.load('/resources/images/bicycle/load_bg-ex.jpg');
    // backgroundTexture.colorSpace = THREE.SRGBColorSpace;
    // scene.background = backgroundTexture;

    // ---*Light
    const ambientLight = new THREE.AmbientLight(0xffffff, 10);
    const directionalLight = new THREE.DirectionalLight(0xffffff, 6);
    directionalLight.position.set(30, 20, 5);
    const pointLight = new THREE.PointLight(0xffffff, 15, 100);
    pointLight.position.set(-4,-5, 10)

    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.top = 10;
    directionalLight.shadow.camera.bottom = -10;
    directionalLight.shadow.camera.left = -10;
    directionalLight.shadow.camera.right = 10;


    directionalLight.castShadow = true //⭐빛에 castshadow 설정
    directionalLight.shadow.radius = 2 //그림자 블러

    scene.add(ambientLight,directionalLight,pointLight);

    if (_DEBUG) {
        setGuiLight([directionalLight,pointLight]);
        const directionalLightHelper = new THREE.DirectionalLightHelper(directionalLight, 1);
        scene.add(directionalLightHelper);
        const pointLightHelper = new THREE.PointLightHelper( pointLight, 1 );
        scene.add(pointLightHelper );
    }

    // ---* 지면 
    const ground = new THREE.Mesh(
        new THREE.PlaneGeometry(areaWidth, areaHeight,100,100), // 지면의 크기
        new THREE.ShadowMaterial({ opacity: .5 }) // 그림자만 렌더링, 투명도 설정
    );
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -6.2
    scene.add(ground)
    //⭐그림자를 받아줄 도형에 receiveShadow 설정
    ground.receiveShadow = true



    // ---OrbitControls : 다양한 각도에서 모델 보기 활성화 * Animate에서 
    let controls = new OrbitControls(camera, renderer.domElement);
    controls.enabled = false;
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


    //모델 로드 
    function setModel(){
        gltfLoader.load(MODEL_PATH + '/models/bicycle.glb', (gltf) => {

            model = gltf.scene; //model 의 scene
            model.scale.multiplyScalar(6);//model 객체 조작 | 크기조정
            // model.rotation.y=-.6; //위치 수정
            model.position.set(0, -2.5, 0); //위치 수정
            cameraRotateGroupX.rotation.set(0,0,0)
            cameraRotateGroupY.rotation.set(0,0,0)
          
            scene.add(model);

            //모델 기본 디자인 수정
            model.traverse((child) => {

                if(child.name == 'Mtb_Wheel_Tire_0' || child.name == 'Circle005_Black_Metal_0' || child.name == 'Circle005_Rim_0'){
                    frontWheel.push(child)
                }
                


                if(child.isMesh) {//요소가 mash인지 확인(mesh === 렌더된 객체)
                    child.castShadow = true; //객체 요소들 그림자 여부 
                    child.receiveShadow = true; // 그림자를 받음
                }
                //패달
                if (child.isObject3D && child.name === 'Circle006') {
                    gsap.to(child.rotation, { z: -Math.PI * 6,duration: 2,ease: 'ease-in-out'});
                }

                //wheel
                if(child.isMesh && child.name === 'Mtb_Wheel001_Tire_0' || child.name === 'Mtb_Wheel_Tire_0') {
                    gsap.to(child.rotation, {x: Math.PI * 3,duration: 2,ease: 'ease-in-out'});
                      modelMeshes.wheel = child;
                      child.material.metalness = 0.5;
                      child.material.roughness = 0.5;
                }
                //curve
                 if(child.isMesh && child.name.includes('BezierCurve')) {
                    modelMeshes.curve = child;
                      child.material.metalness = 0.3;
                      child.material.roughness = 0.3;
                }
                //프레임 초기화
                if(child.isMesh && child.name ==('Cylinder_UV2_0')) {
                    modelMeshes.frame = child;
                    child.material.metalness = 0.5;
                    child.material.roughness = 0.2;
                    child.material.map = null;
                    child.material.color.set(0x000000);
                }
                if(child.isMesh && child.name.includes('Wheel')){
                    child.material.map = null;
                    child.material.color.set(0x1A1A1A);
                   
                }
                if(child.isMesh && child.name === 'Circle002_Rim_0' || child.name === 'Circle005_Rim_0'){
                    child.material.map = null;
                    child.material.color.set(0x1A1A1A);
                }


            })


            if (_DEBUG) {
                const meshControls = _DEBUG.gui.addFolder('mesh');
                meshControls.add(modelMeshes.wheel.material, 'metalness', 0, 1, 0.01).name('wheel metal');
                meshControls.add(modelMeshes.wheel.material, 'roughness', 0, 1, 0.01).name('wheel rough');
                meshControls.add(modelMeshes.curve.material, 'metalness', 0, 1, 0.01).name('curve metal');
                meshControls.add(modelMeshes.curve.material, 'roughness', 0, 1, 0.01).name('curve rough');
                meshControls.add(modelMeshes.frame.material, 'metalness', 0, 1, 0.01).name('frame metal');
                meshControls.add(modelMeshes.frame.material, 'roughness', 0, 1, 0.01).name('frame rough');
        
            }



            //모델 등장 애니메이션
            const mTl = gsap.timeline();
            //  mTl.from(model.position, {x:-Math.PI*10,z:-Math.PI*8, duration:2, ease: 'ease-in-out' },'<=');
             mTl.from(model.position, {x: -Math.PI * 10, duration:2, ease: 'ease-in-out' },);
            //  mTl.to(model.rotation, {y:0, duration:2, ease: 'ease-in-out'},);

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
        timeline.to(cameraRotateGroupX.rotation, { x:0,y:-Math.PI * 1.78, duration, ease },'seq-1');
        timeline.to(cameraRotateGroupY.rotation, { x:.3, duration, ease},'seq-1');
        timeline.to(camera.position, {x:1, y:-1.8,z:11.5, duration, ease },'seq-1');
        timelineTimeStamps.push(timeline.totalDuration());

        //손잡이
        areaInfo = getAreaInfo($sections[2]);
        timeline.to(cameraRotateGroupX.rotation, {x:.05, y:1.6, duration, ease},'seq-2');
        timeline.to(cameraRotateGroupY.rotation, { x:-.4, duration, ease},'seq-2');
        timeline.to(camera.position, {x:1,y:-1,z:5, duration, ease },'seq-2');
        timelineTimeStamps.push(timeline.totalDuration());

         //안장 & 프레임
         areaInfo = getAreaInfo($sections[3]);
         timeline.to(cameraRotateGroupX.rotation, {x:0, y:Math.PI * 2, duration, ease},'seq-3');
         timeline.to(cameraRotateGroupY.rotation, { x:0, duration, ease},'seq-3');
         timeline.to(camera.position, {x:0,y:-.5, z:7.5, duration, ease},'seq-3');
         timelineTimeStamps.push(timeline.totalDuration());

        //바퀴 디테일
        areaInfo = getAreaInfo($sections[4]);
        timeline.to(cameraRotateGroupX.rotation, {x:0, y:Math.PI * 2, duration, ease},'seq-4');
        timeline.to(cameraRotateGroupY.rotation, { x:0, duration, ease},'seq-4');
        timeline.to(camera.position, {x:-3.8,y:-3.5, z:5, duration, ease},'seq-4');
        timelineTimeStamps.push(timeline.totalDuration());
        
        areaInfo = getAreaInfo($sections[5]);
        // timeline.to(camera.position, {x:0,y:-2.5, z:9, duration, ease},'seq-4');
        // timeline.to(cameraRotateGroupX.rotation, {y:4.718, duration, ease},'seq-4');
        // timeline.to(cameraRotateGroupY.rotation, {x:.3, duration, ease},'seq-4');
        timeline.to(cameraRotateGroupX.rotation, {x:-.5, y:2.5, duration, ease},'seq-5');
        timeline.to(cameraRotateGroupY.rotation, {x:.2, duration, ease},'seq-5');
        timeline.to(camera.position, {x:-3,y:-1, z:12, duration, ease},'seq-5');
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

        console.log(scrollTop)
        if (scrollTop >= 250) {

            
          gsap.to(ground.material, { opacity: 0, duration: 1, ease: 'power4.out' });
        }else{
            gsap.to(ground.material, { opacity: 1, duration: 1, ease: 'power4.out' });
        }


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

        createTimeline();
        renderRequest();
        
    }
    onResize();

    //마우스 이벤트
    window.addEventListener('mousemove', (e) => {

        if(model){
            const mouseX = (event.clientX / window.innerWidth) * 2 - 1;
            const mouseY = -(event.clientY / window.innerHeight) * 2 + 1;

            gsap.to(model.rotation, { x: mouseX * 0.1, y:  mouseY * 0.1, duration: 0.5, ease: 'power4.out' });
        }

    }); 

 
    const sectionAni = (function() {

        const $section = document.querySelector('.sec-05');
        let timeline;
        let sectionHeight = $section.offsetHeight;

        function scrollAni(){
            const rect = $section.getBoundingClientRect();
            if (rect.top < areaHeight / 2 && rect.bottom > areaHeight / 2) {
                const progress = Math.min(1, -(rect.top - areaHeight) / sectionHeight);
            }

            if (rect.top + (rect.height / 2) < areaHeight / 2) {
                $section.classList.add('active');

            } else {
                $section.classList.remove('active');
                if(model){
                    model.traverse((child) => {
                        if(child.isMesh){
                            child.material.transparent = true;
                            gsap.to(child.material, {opacity: 1,duration:1.2, });
                        }
                    })
                }
            }



        }


        function createTimeline () {
            timeline && timeline.kill();
            timeline = gsap.timeline({ paused: true });
        }

        function sectionResize(){
            sectionHeight = $section.offsetHeight;
            createTimeline();
            scrollAni();
        }

        sectionResize();
        window.addEventListener('scroll', scrollAni);
        window.addEventListener('resize', sectionResize);

    })();
    // //클릭 이벤트 
    const customColot = (function() {
        const $colorBar = document.querySelector('.color-bar');
        const $items = document.querySelectorAll('.color-bar .item');
        const $chips = document.querySelectorAll('.color-bar .chip');
        let onItem = 'saddle';//임시
        let onChip = 'black';//임시


        $items.forEach((item)=>{
            item.addEventListener('click',(e)=>{
                $items.forEach((item)=>{item.classList.remove('on')})
                item.classList.toggle('on')

                let itemName  = item.getAttribute('data-item');
                onItem = itemName;
            })
        })
        $chips.forEach((chip)=>{
            chip.addEventListener('click',()=>{
                $chips.forEach((chip)=>{chip.classList.remove('on')})
                chip.classList.toggle('on')

                let itemName  = chip.getAttribute('data-name');
                onChip = itemName;
                onCustomBike()
            })
        })

        function onCustomBike(){

             //모델 기본 디자인 수정
             if(model){

            
                model.traverse((child) => {
                    //color test
                
                    if(onItem === 'saddle' && child.isMesh && child.name === ('Plane_Black_Plastic_0')){
                        console.log(child)
                        if(onChip === 'black'){
                            child.material.color.set(0x000000);
                        }else if(onChip === 'gray'){
                            child.material.color.set(0x222222);
                        }
                        
                    }
                    if(onItem === 'frame' && child.isMesh && child.name === ('Cylinder_UV2_0')){
                        if(onChip === 'black'){
                            child.material.color.set(0x000000);
                        }else if(onChip === 'gray'){
                            child.material.color.set(0x222222);
                        }else if(onChip === 'orange'){
                            child.material.color.set(0xc54b00);
                        }else if(onChip === 'oliveGreen'){
                            child.material.color.set(0x856f1d);
                        }else if(onChip === 'red'){
                            child.material.color.set(0x9a010d);
                        }else if(onChip === 'ionBlue'){
                            child.material.color.set(0x1a7682);
                        }
                    }
                    
                    if(onItem === 'wheel' && child.isMesh && child.name.includes('Wheel')){
                        if(onChip === 'black'){
                            child.material.color.set(0x1A1A1A);
                        }else if(onChip === 'gray'){
                            child.material.color.set(0x222222);
                        }else if(onChip === 'orange'){
                            child.material.color.set(0xc54b00);
                        }else if(onChip === 'oliveGreen'){
                            child.material.color.set(0x856f1d);
                        }else if(onChip === 'red'){
                            child.material.color.set(0x9a010d);
                        }else if(onChip === 'ionBlue'){
                            child.material.color.set(0x1a7682);
                        }
                    }


                    
                })
            }



        }

      

    
    })();

    //클릭 이벤트
    $bikeItem.forEach((item)=>{
        item.addEventListener('click', (e)=>{
            let itemBtn  = e.target.dataset.item;

              //모델 기본 디자인 수정
              model.traverse((child) => {
                console.log(child.name)
                if(child.isMesh){
                    child.material.transparent = true;
                    gsap.to(child.material, {opacity: 0,duration:.5, });
                }
                // //color test
                if(itemBtn == 'wheel'){
                    if (
                        child.name === 'Mtb_Wheel001_Tire_0' ||
                        child.name === 'Circle002_Rim_0' || 
                        child.name === 'Circle002_Black_Metal_0'
                      ) {
                        child.material = child.material.clone();
                        child.material.transparent = false;
                        gsap.to(child.material, {opacity: 1,duration: 1,ease: "power2.inOut" });
                      }

                }else if(itemBtn == 'hub'){
                    if (
                        child.name === 'Circle004_Shiny_Metal_0' ||
                        child.name === 'Circle001_Black_Metal_0' || 
                        child.name === 'Plane001_Black_Metal_0' ||
                        child.name === 'Circle006_Black_Metal_0' ||
                        child.name === 'group_6_Shiny_Metal_0' ||
                        child.name === 'group_6_Shiny_Metal_0_1' || 
                        child.name === 'group_6_Shiny_Metal_0_2'
                      ) {
                        child.material = child.material.clone();
                        child.material.transparent = false;
                        gsap.to(child.material, {opacity: 1,duration: 1,ease: "power2.inOut" });
                      }

                }else if(itemBtn == 'bone'){
                    if (
                        child.name === 'Cylinder069_UV7_0' ||
                        child.name === 'Plane001_Metal_0' ||
                        child.name === 'Hayes_Mag_9_-_Disk_Brake_Caliper001_Black_Metal_0'||
                        child.name ==='BezierCurve.001_Black Plastic_0'
                      ) {
                        child.material = child.material.clone();
                        child.material.transparent = false;
                        gsap.to(child.material, {opacity: 1,duration: 1,ease: "power2.inOut" });  
                      }

                }
            })

          
        });
    })


   
    state.on('ready', onReady);
    state.on('scroll', onScroll);
    state.on('resize', onResize);

})();