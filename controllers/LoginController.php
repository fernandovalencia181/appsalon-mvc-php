<?php 

namespace Controllers;

use Classes\Email;
use Model\Usuario;
use MVC\Router;

class LoginController{
    public static function login(Router $router){
        $alertas=[];
        $auth=new Usuario;
        if($_SERVER["REQUEST_METHOD"]==="POST"){
            $auth=new Usuario($_POST);
            $alertas=$auth->validarLogin();
            if(empty($alertas)){
                // Comprobar que exista el usuario
                /** @var \Model\Usuario|null $usuario */
                $usuario=Usuario::where("email",$auth->email);
                if($usuario){
                    //Verificar el password
                    if($usuario->comprobarPasswordAndVerificado($auth->password)){
                        // Autenticar el usuario
                        session_start();
                        $_SESSION["id"]=$usuario->id;
                        $_SESSION["nombre"]=$usuario->nombre . " " . $usuario->apellido;
                        $_SESSION["email"]=$usuario->email;
                        $_SESSION["login"]=true;

                        // Redireccionamiento

                        if($usuario->admin==="1"){
                            $_SESSION["admin"]=$usuario->admin??null;
                            header("Location: /admin");
                        }else{
                            header("Location: /cita");
                        }
                    }
                } else{
                    Usuario::setAlerta("error","Usuario no encontrado");
                }
            }
        }
        $alertas=Usuario::getAlertas();
        $router->render("auth/login",[
            "alertas"=>$alertas,
            "auth"=>$auth
        ]);
    }

    public static function logout(){
        if (session_status() === PHP_SESSION_NONE) {
            session_start();
        }

        $_SESSION = []; // Vacía el contenido de la sesión

        session_destroy(); // Opcional: destruye completamente la sesión en el servidor

        header("Location: /");
        exit;
    }

    public static function olvide(Router $router){
        $alertas=[];
        if($_SERVER["REQUEST_METHOD"]==="POST"){
            $auth=new Usuario($_POST);
            $alertas=$auth->validarEmail();
            if(empty($alertas)){
                $usuario=Usuario::where("email",$auth->email);
                debuguear($usuario);
                if($usuario && $usuario->confirmado==="1"){
                    // Generar un token
                    $usuario->crearToken();
                    $usuario->guardar();
                    // Enviar el mail
                    $email=new Email($usuario->nombre,$usuario->email,$usuario->token);
                    $email->enviarInstrucciones();
                    // Alerta de exito
                    Usuario::setAlerta("exito","Revisa tu email");
                }else{
                    Usuario::setAlerta("error","El usuario no existe o no esta confirmado");
                }
            }
        }
        $alertas=Usuario::getAlertas();
        $router->render("auth/olvide-password",[
            "alertas"=>$alertas
        ]);
    }

    public static function recuperar(Router $router){
        $alertas=[];
        $error=false;
        $token=s($_GET["token"]);
        // Buscar usuario por su token
        $usuario=Usuario::where("token",$token);
        if(empty($usuario)){
            Usuario::setAlerta("error","Token No Válido");
            $error=true;
        }
        if($_SERVER["REQUEST_METHOD"]==="POST"){
            // Leer el nuevo password y guardarlo
            $password=new Usuario($_POST);
            $alertas=$password->validarPassword();
            if(empty($alertas)){
                $usuario->password=null;
                $usuario->password=$password->password;
                $usuario->hashPassword();
                $usuario->token=null;
                $resultado=$usuario->guardar();
                if($resultado){
                    header("Location: /");
                }
            }
        }
        $alertas=Usuario::getAlertas();
        $router->render("auth/recuperar-password",[
            "alertas"=>$alertas,
            "error"=>$error
        ]);
    }

    public static function crear(Router $router){
        $usuario=new Usuario();
        // Alertas vacias
        $alertas=[];
        if($_SERVER["REQUEST_METHOD"]==="POST"){
            $usuario->sincronizar($_POST);
            $alertas=$usuario->validarNuevaCuenta();
            // Revisar que alertas este vacio
            if(empty($alertas)){
                // Verificar que el usuario no este registrado
                $resultado=$usuario->existeUsuario();

                if($resultado->num_rows){
                    $alertas=Usuario::getAlertas();
                }else{
                    // Hashear el Password
                    $usuario->hashPassword();
                    // Generar un token único
                    $usuario->crearToken();
                    // Enviar el email
                    $email= new Email($usuario->nombre, $usuario->email, $usuario->token);
                    $email->enviarConfirmacion();
                    // Crear el usuario
                    $resultado=$usuario->guardar();
                    
                    if($resultado){
                        header("Location: /mensaje");
                    }
                }
            }
        }
        $router->render("auth/crear-cuenta",[
            "usuario"=>$usuario,
            "alertas"=>$alertas
        ]);
    }

    public static function mensaje(Router $router){
        $router->render("auth/mensaje");
    }

    public static function confirmar(Router $router){
        $alertas=[];

        // Validar que exista token y no sea nulo
        if (!isset($_GET["token"]) || empty($_GET["token"])) {
            Usuario::setAlerta("error", "Token no válido");
            $alertas = Usuario::getAlertas();

            return $router->render("auth/confirmar-cuenta", [
                "alertas" => $alertas
            ]);
        }

        $token=s($_GET["token"]);
        $usuario=Usuario::where("token",$token);
        if(empty($usuario)){
            // Mostrar mensaje de error
            Usuario::setAlerta("error","Token no válido");
        }else{
            // Modificar a usuario confirmado
            $usuario->confirmado="1";
            $usuario->token=null;
            $usuario->guardar();
            Usuario::setAlerta("exito","Cuenta comprobada correctamente");
        }
        // Obtener alertas
        $alertas=Usuario::getAlertas();
        // Renderizar la vista
        $router->render("auth/confirmar-cuenta",[
            "alertas"=>$alertas
        ]);
    }
}