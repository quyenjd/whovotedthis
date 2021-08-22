import { Link as RouterLink, LinkProps, useLocation } from 'react-router-dom';

/**
 * A wrapper for React Router's Link element that auto sets replace=true if
 * the new path is the same as the old one.
 * @param props Props to pass to React Router's Link element.
 * @returns Wrapped element.
 */
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
