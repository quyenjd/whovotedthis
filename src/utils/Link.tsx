import { Link as RouterLink, LinkProps, useLocation } from 'react-router-dom';

export default function Link(props: LinkProps) {
    const location = useLocation();
    const { to, replace, ...rest } = props;

    return (
        <RouterLink
            to={props.to}
            replace={location.pathname === props.to ? true : undefined}
            {...rest}
        />
    );
}
