<?php

namespace Controllers;

use Model\Proyecto;
use MVC\Router;

class DashboardController{

    public static function index(Router $router){
        session_status() === PHP_SESSION_NONE && session_start();
        isAuth();
        $id=$_SESSION['id'];
        $proyectos=Proyecto::belongsTo('propietarioId',$id);
        $router->render("dashboard/index",[
            'titulo'=>'Proyectos',
            'proyectos'=>$proyectos
        ]);
    }

    public static function crear_proyecto(Router $router){
        session_status() === PHP_SESSION_NONE && session_start();     
        isAuth();  
        $alertas=[];
        if($_SERVER['REQUEST_METHOD']==='POST'){
            $proyecto= new Proyecto($_POST);
            //validacion
            $alertas=$proyecto->validarProyecto();
            if(empty($alertas)){
                // Genera una URL única 
                $proyecto->url=md5(uniqid());
                // Almacenar el creador del proyecto
                $proyecto->propietarioId=$_SESSION['id'];
                // Guardar el Proyecto
                $proyecto->guardar();
                // Redireccionar
                header('Location: /proyecto?id=' . $proyecto->url);
            }
        }
        $router->render("dashboard/crear-proyecto",[
            'titulo'=>'Crear Proyecto',
            'alertas'=>$alertas
        ]);       
    }

    public static function proyecto(Router $router){
        session_status() === PHP_SESSION_NONE && session_start();
        isAuth();
        $token=$_GET['id'];
        // Revisar que existe el token
        if(!$token) header('Location: /dashboard');
        //Revisar que la persona que visita el proyecto, es quien lo creó
        /** @var \Model\Proyecto|null $proyecto */
        $proyecto=Proyecto::where('url',$token);
        if($proyecto->propietarioId!==$_SESSION['id']){
            header('Location: /dashboard');
        }
        $router->render("dashboard/proyecto",[
            'titulo'=>$proyecto->proyecto
            // 'alertas'=>$alertas
        ]); 
    }

    public static function perfil(Router $router){
        session_status() === PHP_SESSION_NONE && session_start();       

        $router->render("dashboard/perfil",[
            'titulo'=>'Perfil'
        ]);       
    }
}